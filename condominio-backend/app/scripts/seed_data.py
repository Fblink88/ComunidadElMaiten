"""
Script para poblar la base de datos con datos de prueba realistas.
Simula 10 departamentos, propietarios, arrendatarios y 1 año de historia.

Uso:
    python -m app.scripts.seed_data
"""

import sys
import os
import random
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import auth, firestore

# Asegurar que el directorio raíz está en el path
sys.path.append(os.getcwd())

from app.config.firebase import db
from app.models import (
    DepartamentoCreate, UsuarioCreate, RolUsuario,
    GastoMensualCreate, ItemGasto, PagoCreate, MetodoPago, EstadoPago
)
from app.services import (
    DepartamentoService, UsuarioService, GastoService, PagoService
)

# Inicializar servicios
dept_service = DepartamentoService()
user_service = UsuarioService()
gasto_service = GastoService()
pago_service = PagoService()

def limpiar_base_datos():
    """Elimina todos los datos de las colecciones principales."""
    print("🧹 Limpiando base de datos...")
    
    collections = ['pagos', 'gastos_mensuales', 'gastos_extraordinarios', 'usuarios', 'departamentos']
    
    for coll_name in collections:
        print(f"   - Eliminando colección: {coll_name}")
        docs = db.collection(coll_name).stream()
        for doc in docs:
            # Eliminar documento
            db.collection(coll_name).document(doc.id).delete()
            
            # Si es usuario, también eliminar de Auth
            if coll_name == 'usuarios':
                try:
                    auth.delete_user(doc.id)
                except:
                    pass

    print("✅ Base de datos limpia.")

def crear_departamentos():
    """Crea los 10 departamentos solicitados."""
    print("🏗️ Creando departamentos...")
    
    deptos_data = [
        {"numero": "11", "propietario": "Juan Pérez", "m2": 50, "piso": 1},
        {"numero": "12", "propietario": "María González", "m2": 55, "piso": 1},
        {"numero": "21", "propietario": "Carlos López", "m2": 50, "piso": 2},
        {"numero": "22", "propietario": "Ana Rodríguez", "m2": 55, "piso": 2},
        {"numero": "31", "propietario": "Roberto Fernández", "m2": 50, "piso": 3},
        {"numero": "32", "propietario": "Lucía Morales", "m2": 55, "piso": 3},
        {"numero": "41", "propietario": "Pedro Ramírez", "m2": 52, "piso": 4},
        {"numero": "42", "propietario": "Sofía Torres", "m2": 58, "piso": 4},
        {"numero": "51", "propietario": "Diego Castro", "m2": 52, "piso": 5},
        {"numero": "52", "propietario": "Elena Vargas", "m2": 58, "piso": 5},
    ]
    
    created_deptos = {}
    
    for d in deptos_data:
        try:
            # Crear o actualizar departamento
            # (Usamos lógica simple directa para asegurar IDs limpios si fuera necesario, 
            # pero usaremos el servicio para validar)
            depto_create = DepartamentoCreate(
                numero=d["numero"],
                propietario=d["propietario"],
                metros_cuadrados=d["m2"],
                activo=True
            )
            
            # El servicio crea un ID automático.
            # Para facilitar las relaciones, guardaremos el objeto retornado.
            result = dept_service.crear(depto_create)
            created_deptos[d["numero"]] = result
            print(f"   - Depto {d['numero']} creado (ID: {result['id']})")
            
        except Exception as e:
            print(f"❌ Error creando depto {d['numero']}: {e}")

    return created_deptos

def crear_usuarios(deptos):
    """Crea usuarios: Admin, Propietarios y algunos Arrendatarios."""
    print("👥 Creando usuarios...")
    
    # 1. Admin Global
    try:
        admin_email = "edificio.elmaiten@gmail.com"
        admin_pass = "admin123456" # Password default para pruebas
        
        try:
            user = auth.create_user(email=admin_email, password=admin_pass, display_name="Administrador")
            uid = user.uid
        except auth.EmailAlreadyExistsError:
            user = auth.get_user_by_email(admin_email)
            uid = user.uid

        user_service.crear(uid, UsuarioCreate(
            email=admin_email,
            nombre="Administrador General",
            rol=RolUsuario.ADMIN,
            es_admin=True,
            activo=True
        ))
        # Asegurar update si ya existía (en caso de que limpieza fallara parcialmente)
        user_service.usuario_repo.update(uid, {"activo": True, "es_admin": True})
        
        print(f"   - Admin creado: {admin_email}")
        
    except Exception as e:
        print(f"⚠️ Warning Admin: {e}")

    # 2. Propietarios (uno por depto)
    users_created = []
    
    for num, depto in deptos.items():
        try:
            # Datos simulados
            nombre = f"nvecino{num}"
            apellido = f"apvecino{num}"
            email = f"vecino{num}@ejemplo.com"
            password = "password123"
            
            # Crear en Firebase Auth
            try:
                user = auth.create_user(email=email, password=password, display_name=f"{nombre} {apellido}")
                uid = user.uid
            except auth.EmailAlreadyExistsError:
                user = auth.get_user_by_email(email)
                uid = user.uid
                
            # Crear en Firestore
            usuario_data = UsuarioCreate(
                email=email,
                nombre=f"{nombre} {apellido}",
                rol=RolUsuario.PROPIETARIO,
                es_admin=False,
                activo=True,
                departamento_id=depto['id']
            )
            
            # Usar repo directo para forzar update si existe
            user_service.usuario_repo.create_with_uid(uid, usuario_data.model_dump())
            
            # Vincular al depto
            # Creamos un usuario admin dummy para pasar la validación de permisos
            admin_user_dummy = {"es_admin": True, "id": "SEED_SCRIPT", "rol": RolUsuario.ADMIN}
            dept_service.agregar_usuario(depto['id'], uid, admin_user_dummy)
            
            users_created.append({"uid": uid, "depto_id": depto['id'], "email": email})
            print(f"   - Propietario creado para Depto {num}: {email}")
            
        except Exception as e:
            print(f"❌ Error usuario Depto {num}: {e}")

    return users_created

def generar_historia(deptos):
    """Genera gastos y pagos para los últimos 12 meses."""
    print("📅 Generando historia anual...")
    
    hoy = datetime.now()
    
    # Generar últimos 12 meses
    for i in range(12, 0, -1):
        fecha_mes = hoy - timedelta(days=30 * i)
        periodo = fecha_mes.strftime("%Y-%m")
        print(f"   Processing {periodo}...")
        
        # 1. Crear Gasto Mensual
        monto_base = 500000 + random.randint(0, 100000) # Gasto común del edificio variable
        
        gasto_data = GastoMensualCreate(
            periodo=periodo,
            items=[
                ItemGasto(concepto="Sueldos Personal", monto=int(monto_base * 0.4)),
                ItemGasto(concepto="Agua Potable", monto=int(monto_base * 0.15)),
                ItemGasto(concepto="Electricidad", monto=int(monto_base * 0.1)),
                ItemGasto(concepto="Mantención Ascensores", monto=int(monto_base * 0.2)),
                ItemGasto(concepto="Insumos Aseo", monto=int(monto_base * 0.15)),
            ]
        )
        
        # Creamos un usuario admin dummy para pasar la validación de permisos
        admin_user_dummy = {"es_admin": True, "id": "SEED_SCRIPT", "rol": RolUsuario.ADMIN}
        gasto = gasto_service.crear_gasto_mensual(gasto_data, admin_user_dummy)
        
        # 2. Generar Pagos para cada Depto
        for num, depto in deptos.items():
            # Probabilidades de estado según antigüedad
            
            # Meses antiguos (historia): Mayoría pagados
            # Meses recientes (1-2 meses atrás): Algunos pendientes o verificando
            meses_atras = i
            
            estado = EstadoPago.PAGADO
            metodo = MetodoPago.TRANSFERENCIA_MANUAL
            
            if meses_atras <= 1: # Mes actual o anterior
                dice = random.random()
                if dice < 0.3: estado = EstadoPago.PENDIENTE
                elif dice < 0.5: estado = EstadoPago.VERIFICANDO
                else: estado = EstadoPago.PAGADO
            elif meses_atras <= 3: # Hace 2-3 meses
                if random.random() < 0.1: estado = EstadoPago.RECHAZADO # Algún problema
            
            # Si es pendiente, no creamos pago (la deuda existe implícita por el gasto)
            # PERO el sistema actual registra DEUDAS como pagos con estado pendiente?
            # Revisando el sistema: El sistema crea pagos cuando el usuario PAGA.
            # La deuda se calcula dinámicamente o se pre-crean pagos pendientes?
            # En muchos sistemas de GC, el cobro se genera.
            # En este sistema `crear_mensual` de gasto_service genera cuotas automáticas?
            # Vamos a asumir que `gasto_service.crear_mensual` ya genera la deuda/cobro
            # o que debemos generar el registro de pago nosotros.
            
            # Verificamos GastoService:
            # Al crear gasto mensual suele calcular prorrateo.
            # Si el modelo de datos es "Pago" para registrar la transacción,
            # entonces un "no pago" es ausencia de registro o registro pendiente.
            # Para efectos de historial visual, crearemos registros.
            
            # Calcular monto para este depto (prorrateo simple simulado o exacto)
            # El gasto service ya debería haberlo calculado internamente si tuviera esa lógica,
            # pero aquí lo simulamos.
            total_m2_edificio = sum(d['metros_cuadrados'] for d in deptos.values())
            participacion = depto['metros_cuadrados'] / total_m2_edificio
            monto_cuota = int(gasto['total'] * participacion)
            
            if estado != EstadoPago.PENDIENTE:
                # Simular fecha de pago aleatoria dentro del mes siguiente
                fecha_pago = fecha_mes + timedelta(days=random.randint(1, 20))
                
                # Crear Pago
                pago_data = PagoCreate(
                    departamento_id=depto['id'],
                    monto=monto_cuota,
                    periodo=periodo,
                    metodo=metodo,
                    notas=f"Pago gastos comunes {periodo}"
                )
                
                # Hack: Usamos repositorio directo para forzar estado y fechas históricas
                pago_dict = pago_data.model_dump()
                pago_dict.update({
                    "estado": estado,
                    "created_at": fecha_pago,
                    "updated_at": fecha_pago,
                    "nombre_pagador": depto["propietario"],
                    "fecha_transferencia": fecha_pago,
                    "verificado_por": "system_seed" if estado == EstadoPago.PAGADO else None
                })
                
                if estado == EstadoPago.PAGADO:
                    pago_dict["fecha_pago"] = fecha_pago
                
                # Guardar en DB
                pago_service.pago_repo.create(pago_dict)
                print(f"      - Depto {num}: {estado} ({monto_cuota})")

def main():
    print("🚀 Iniciando script de población de datos...")
    
    if input("⚠️  ESTO BORRARÁ TODOS LOS DATOS. ¿Continuar? (s/n): ").lower() != 's':
        print("Cancelado.")
        return

    try:
        limpiar_base_datos()
        
        deptos = crear_departamentos()
        
        if not deptos:
            print("❌ No se pudieron crear departamentos. Abortando.")
            return
            
        crear_usuarios(deptos)
        
        generar_historia(deptos)
        
        print("\n✨ Población de datos completada exitosamente.")
        
    except Exception as e:
        print(f"\n❌ Error fatal en el script: {e}")

if __name__ == "__main__":
    main()
