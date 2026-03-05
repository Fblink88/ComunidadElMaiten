import logging
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List

from firebase_admin import auth
from google.cloud.firestore_v1.base_query import FieldFilter

from app.config.firebase import db
from app.config import settings
from app.repositories import DepartamentoRepository

logger = logging.getLogger(__name__)

class SeedDataService:
    """
    Servicio para poblar y limpiar la base de datos con datos de prueba.
    """

    def __init__(self):
        self.depto_repo = DepartamentoRepository()
        self.usuarios_ref = db.collection('usuarios')
        self.pagos_ref = db.collection('pagos')
        self.gastos_ref = db.collection('gastos_mensuales')

    async def seed_data(self) -> Dict[str, Any]:
        """
        Genera 10 departamentos, 10 propietarios, 5 arrendatarios y pagos de prueba.
        """
        try:
            # 1. Crear departamentos
            deptos = self._seed_departamentos()

            # 1.5 Asegurar Admin
            self._seed_admin()
            
            # 2. Crear usuarios (Propietarios y Arrendatarios)
            usuarios = self._seed_usuarios(deptos)
            
            # 3. Crear deudas/pagos
            pagos = self._seed_pagos(deptos)

            return {
                "success": True,
                "message": f"Datos generados: {len(deptos)} deptos, {len(usuarios)} usuarios, {len(pagos)} pagos."
            }
        except Exception as e:
            logger.error(f"Error seeding data: {str(e)}")
            raise e

    async def clear_data(self) -> Dict[str, Any]:
        """
        Elimina todos los datos EXCEPTO usuarios administradores.
        """
        try:
            deleted_counts = {
                "pagos": 0,
                "gastos": 0,
                "departamentos": 0,
                "usuarios": 0
            }

            # 1. Eliminar pagos
            batch = db.batch()
            count = 0
            for doc in self.pagos_ref.stream():
                batch.delete(doc.reference)
                count += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            if count > 0:
                batch.commit()
            deleted_counts["pagos"] = count

            # 2. Eliminar gastos
            batch = db.batch()
            count = 0
            for doc in self.gastos_ref.stream():
                batch.delete(doc.reference)
                count += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            if count > 0:
                batch.commit()
            deleted_counts["gastos"] = count

            # 3. Eliminar departamentos
            batch = db.batch()
            count = 0
            deptos = self.depto_repo.get_all()
            for depto in deptos:
                doc_ref = self.depto_repo.collection.document(depto['id'])
                batch.delete(doc_ref)
                count += 1
                if count >= 400:
                    batch.commit()
                    batch = db.batch()
                    count = 0
            if count > 0:
                batch.commit()
            deleted_counts["departamentos"] = count

            # 4. Eliminar usuarios no admin
            users_to_delete = []
            
            # Filtrar usuarios que NO son admin
            # Nota: Firestore no soporta filtro '!=' directamente de manera eficiente en todas las versiones,
            # así que iteramos y filtramos en código o usamos 'where' si la estructura lo permite.
            # Asumimos que los admins tienen es_admin=True
            
            all_users = self.usuarios_ref.stream()
            for user_doc in all_users:
                user_data = user_doc.to_dict()
                if not user_data.get('es_admin', False):
                    # Borrar de Auth
                    try:
                        auth.delete_user(user_doc.id)
                    except:
                        pass # Si no existe en Auth, ignorar
                    
                    # Borrar de Firestore
                    self.usuarios_ref.document(user_doc.id).delete()
                    deleted_counts["usuarios"] += 1

            return {
                "success": True,
                "message": "Datos de prueba eliminados correctamente.",
                "details": deleted_counts
            }

        except Exception as e:
            logger.error(f"Error clearing data: {str(e)}")
            raise e

    def _seed_departamentos(self):
        deptos_creados = []
        numeros = [f"{piso}0{depto}" for piso in range(1, 6) for depto in range(1, 3)] # 101, 102, 201... 502
        
        for numero in numeros:
            # Check if exists
            existing = self.depto_repo.get_by_numero(numero)
            if existing:
                deptos_creados.append(existing)
                continue

            depto_data = {
                'numero': numero,
                'propietario': f"Propietario {numero}",
                'metros_cuadrados': random.choice([45.5, 55.0, 62.3, 70.1]),
                'cuota_mensual': random.choice([50000, 65000, 72000, 85000]),
                'activo': True,
                'usuarios_ids': [],
                'saldo_a_favor': 0,
                'created_at': datetime.now()
            }
            new_depto = self.depto_repo.create(depto_data)
            deptos_creados.append(new_depto)
        
        return deptos_creados

    def _seed_usuarios(self, deptos):
        usuarios_creados = []
        
        # 1. Crear Propietarios (uno por depto)
        for depto in deptos:
            numero = depto['numero']
            email = f"propietario{numero}@test.com"
            password = "test123"
            nombre = f"Juan Propietario {numero}"
            
            uid = self._create_firebase_user(email, password, nombre)
            
            user_data = {
                'uid': uid,
                'email': email,
                'nombre': nombre,
                'departamento_id': depto['id'],
                'rol': 'propietario',
                'es_admin': False,
                'activo': True,
                'fecha_registro': datetime.now()
            }
            self.usuarios_ref.document(uid).set(user_data)
            self._add_user_to_depto(depto['id'], uid)
            usuarios_creados.append(user_data)

        # 2. Crear 5 Arrendatarios (en los primeros 5 deptos)
        for i in range(5):
            depto = deptos[i]
            numero = depto['numero']
            email = f"arrendatario{numero}@test.com"
            password = "test123"
            nombre = f"Ana Arrendataria {numero}"
            
            uid = self._create_firebase_user(email, password, nombre)
            
            user_data = {
                'uid': uid,
                'email': email,
                'nombre': nombre,
                'departamento_id': depto['id'],
                'rol': 'arrendatario',
                'es_admin': False,
                'activo': True,
                'fecha_registro': datetime.now()
            }
            self.usuarios_ref.document(uid).set(user_data)
            self._add_user_to_depto(depto['id'], uid)
            usuarios_creados.append(user_data)
            
        return usuarios_creados

    def _seed_pagos(self, deptos):
        pagos_creados = []
        periodos = ["2025-01", "2025-02", "2025-03"]
        
        for depto in deptos:
            for periodo in periodos:
                estado = random.choice(['pendiente', 'pagado', 'pendiente', 'verificando'])
                monto = depto['cuota_mensual']
                
                # Check existance
                query = self.pagos_ref.where('departamento_id', '==', depto['id']).where('periodo', '==', periodo)
                if list(query.stream()):
                    continue

                pago_data = {
                    'departamento_id': depto['id'],
                    'monto': monto,
                    'periodo': periodo,
                    'estado': estado,
                    'metodo': 'khipu',
                    'created_at': datetime.now()
                }
                
                if estado == 'pagado':
                    pago_data['fecha_pago'] = datetime.now()
                elif estado == 'verificando':
                    pago_data['metodo'] = 'transferencia_manual'
                    pago_data['fecha_transferencia'] = datetime.now()
                    pago_data['nombre_pagador'] = f"Pagador Depto {depto['numero']}"

                self.pagos_ref.add(pago_data)
                pagos_creados.append(pago_data)
        
        return pagos_creados

    def _create_firebase_user(self, email, password, display_name):
        try:
            user = auth.get_user_by_email(email)
            return user.uid
        except auth.UserNotFoundError:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            return user.uid

    def _add_user_to_depto(self, depto_id, user_id):
        depto_doc = self.depto_repo.collection.document(depto_id).get()
        if depto_doc.exists:
            data = depto_doc.to_dict()
            usuarios_ids = data.get('usuarios_ids', [])
            if user_id not in usuarios_ids:
                usuarios_ids.append(user_id)
                self.depto_repo.update(depto_id, {'usuarios_ids': usuarios_ids})

    def _seed_admin(self):
        """Asegura que exista el usuario administrador configurado"""
        email = settings.admin_email
        if not email:
            return

        try:
            # 1. Crear/Obtener en Auth
            uid = self._create_firebase_user(email, "admin123", "Administrador Principal")
            
            # 2. Crear/Actualizar en Firestore
            user_data = {
                'uid': uid,
                'email': email,
                'nombre': "Administrador Principal",
                'rol': 'admin',
                'es_admin': True,
                'activo': True,
                'fecha_registro': datetime.now()
            }
            # Usar set con merge=True para no sobrescribir si ya existe, 
            # pero asegurar que es_admin sea True
            self.usuarios_ref.document(uid).set(user_data, merge=True)
            logger.info(f"Admin user seeded: {email}")
            
        except Exception as e:
            logger.error(f"Error seeding admin: {e}")

# Instancia global
seed_data_service = SeedDataService()
