"""
Script para crear un usuario de prueba en Firebase Auth y Firestore.

Crea un usuario asociado al departamento especificado.

Uso:
    python -m app.scripts.crear_usuario_prueba
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from firebase_admin import auth
from app.config.firebase import db
from app.repositories import DepartamentoRepository


def crear_usuario_prueba():
    """
    Crea un usuario de prueba en Firebase Auth y Firestore.
    """
    print("=" * 60)
    print("CREADOR DE USUARIO DE PRUEBA")
    print("=" * 60)
    print()

    # Obtener el departamento 101 que acabamos de crear
    depto_repo = DepartamentoRepository()
    departamentos = depto_repo.get_all()

    if not departamentos:
        print("❌ No hay departamentos. Ejecuta primero:")
        print("   python -m app.scripts.setup_prueba_khipu")
        return

    # Buscar departamento 101
    depto_101 = None
    for depto in departamentos:
        if depto.get('numero') == '101':
            depto_101 = depto
            break

    if not depto_101:
        # Usar el primer departamento disponible
        depto_101 = departamentos[0]
        print(f"⚠️  No se encontró departamento 101, usando: {depto_101.get('numero')}")
    else:
        print(f"✅ Departamento encontrado: {depto_101.get('numero')} (ID: {depto_101['id']})")

    print()
    print("Creando usuario de prueba...")
    print("-" * 60)

    # Datos del usuario de prueba
    email = "vecino@test.com"
    password = "test123"
    nombre = "Vecino de Prueba"

    try:
        # Verificar si el usuario ya existe en Auth
        try:
            user_auth = auth.get_user_by_email(email)
            print(f"✅ Usuario ya existe en Firebase Auth: {email}")
            uid = user_auth.uid
        except auth.UserNotFoundError:
            # Crear usuario en Firebase Auth
            user_auth = auth.create_user(
                email=email,
                password=password,
                display_name=nombre
            )
            uid = user_auth.uid
            print(f"✅ Usuario creado en Firebase Auth: {email}")

        # Verificar si el usuario ya existe en Firestore
        usuarios_ref = db.collection('usuarios')
        query = usuarios_ref.where('email', '==', email)
        existente = list(query.stream())

        if existente:
            # Actualizar el departamento_id del usuario existente
            usuario_doc = existente[0]
            usuarios_ref.document(usuario_doc.id).update({
                'departamento_id': depto_101['id'],
                'rol': 'propietario'
            })
            print(f"✅ Usuario actualizado en Firestore (asociado a depto {depto_101.get('numero')})")
        else:
            # Crear usuario en Firestore
            usuario_data = {
                'uid': uid,
                'email': email,
                'nombre': nombre,
                'departamento_id': depto_101['id'],
                'rol': 'propietario',
                'es_admin': False,
                'activo': True,
                'fecha_registro': datetime.now()
            }

            usuarios_ref.document(uid).set(usuario_data)
            print(f"✅ Usuario creado en Firestore (asociado a depto {depto_101.get('numero')})")

        # Actualizar lista de usuarios del departamento
        usuarios_ids = depto_101.get('usuarios_ids', [])
        if uid not in usuarios_ids:
            usuarios_ids.append(uid)
            depto_repo.update(depto_101['id'], {'usuarios_ids': usuarios_ids})
            print(f"✅ Usuario agregado a la lista del departamento")

        print()
        print("=" * 60)
        print("✅ USUARIO DE PRUEBA CREADO")
        print("=" * 60)
        print()
        print("CREDENCIALES:")
        print("-" * 60)
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print()
        print(f"Departamento: {depto_101.get('numero')}")
        print(f"Rol: Propietario")
        print()
        print("PRÓXIMOS PASOS:")
        print("-" * 60)
        print("1. Asegúrate de que el backend esté corriendo:")
        print("   uvicorn app.main:app --reload")
        print()
        print("2. Asegúrate de que el frontend esté corriendo:")
        print("   npm run dev")
        print()
        print("3. Abre http://localhost:5173/login")
        print()
        print("4. Inicia sesión con:")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print()
        print("5. Ve a /dashboard/pagos")
        print()
        print("6. Verás 3 pagos pendientes")
        print()
        print("7. Click en 'Pagar con Khipu' y prueba el flujo!")
        print()
        print("🚀 ¡Todo listo para probar Khipu!")
        print()

    except Exception as e:
        print(f"\n❌ Error al crear usuario: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    try:
        crear_usuario_prueba()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
