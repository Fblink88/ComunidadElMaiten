"""
Script para crear los usuarios finales de cada departamento y asegurar
que solo exista un usuario por departamento, limpiando usuarios antiguos si los hay.

Uso:
    python -m app.scripts.crear_usuarios_finales
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from firebase_admin import auth
from app.config.firebase import db
from app.repositories import DepartamentoRepository


def crear_usuarios_finales():
    print("=" * 60)
    print("CREADOR DE USUARIOS FINALES - 1 POR DEPTO")
    print("=" * 60)
    print()

    depto_repo = DepartamentoRepository()
    deptos_existentes = depto_repo.get_all()
    
    # Mapeo de numero de depto -> documento completo de depto
    mapa_deptos = { d.get('numero'): d for d in deptos_existentes }

    # Lista de departamentos solicitados:
    deptos_solicitados = ["11", "12", "21", "22", "31", "32", "41", "42", "51", "52"]
    
    # 1. Crear departamentos si no existen
    for num in deptos_solicitados:
        if str(num) not in mapa_deptos:
            print(f"Creando departamento {num} que no existía...")
            depto_data = {
                'numero': str(num),
                'propietario': f"Propietario Depto {num}",
                'metros_cuadrados': 40.0,
                'cuota_mensual': 50000,
                'activo': True,
                'usuarios_ids': [],
                'created_at': datetime.now()
            }
            nuevo_depto = depto_repo.create(depto_data)
            mapa_deptos[str(num)] = nuevo_depto
    
    # 2. Limpiar todos los usuarios NO admin de la BD y de Auth
    print("\n--- Limpiando usuarios antiguos (no admins) de los departamentos solicitados ---")
    usuarios_ref = db.collection('usuarios')
    todos_usuarios = list(usuarios_ref.stream())
    
    ids_deptos_solicitados = [mapa_deptos[str(n)]['id'] for n in deptos_solicitados]
    
    usuarios_a_borrar = []
    
    for u in todos_usuarios:
        u_data = u.to_dict()
        if u_data.get('departamento_id') in ids_deptos_solicitados and not u_data.get('es_admin', False):
            usuarios_a_borrar.append((u.id, u_data.get('email', '')))
    
    for uid, email in usuarios_a_borrar:
        try:
            print(f"Eliminando usuario {email} (UID: {uid})")
            usuarios_ref.document(uid).delete()
            # Eliminar en Auth
            try:
                auth.delete_user(uid)
            except auth.UserNotFoundError:
                pass
        except Exception as e:
            print(f"Aviso al borrar usuario {email}: {str(e)}")
            
    # 3. Limpiar listas de usuarios_ids de los departamentos
    for num in deptos_solicitados:
        depto = mapa_deptos[str(num)]
        depto_repo.update(depto['id'], {'usuarios_ids': []})

    # 4. Crear los nuevos usuarios (1 por depto)
    print("\n--- Creando nuevos usuarios ---")
    
    for num in deptos_solicitados:
        email = f"depto{num}@elmaiten.cl"
        password = f"Maiten{num}"
        nombre = f"Depto {num}"
        depto = mapa_deptos[str(num)]
        
        # Eliminar posible cuenta en Auth si existiera pero sin doc en firestore
        try:
            user_auth = auth.get_user_by_email(email)
            auth.delete_user(user_auth.uid)
        except auth.UserNotFoundError:
            pass

        try:
            # Crear usuario en Firebase Auth
            user_auth = auth.create_user(
                email=email,
                password=password,
                display_name=nombre
            )
            uid = user_auth.uid
            print(f"✅ Usuario creado en Auth y Firestore: {email} | Pass: {password}")

            # Crear usuario en Firestore
            usuario_data = {
                'uid': uid,
                'email': email,
                'nombre': nombre,
                'departamento_id': depto['id'],
                'rol': 'propietario',
                'es_admin': False,
                'activo': True,
                'fecha_registro': datetime.now()
            }

            usuarios_ref.document(uid).set(usuario_data)

            # Actualizar lista de usuarios del departamento
            depto_repo.update(depto['id'], {'usuarios_ids': [uid]})

        except Exception as e:
            print(f"❌ Error al crear usuario {email}: {str(e)}")

    print("\n=" * 60)
    print("✅ PROCESO COMPLETADO EXITOSAMENTE")
    print("=" * 60)

if __name__ == "__main__":
    try:
        crear_usuarios_finales()
    except Exception as e:
        print(f"\n❌ Error General: {str(e)}")
        import traceback
        traceback.print_exc()
