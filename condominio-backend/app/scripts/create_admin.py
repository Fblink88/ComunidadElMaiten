import sys
import os
import asyncio
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos de la app
sys.path.append(os.getcwd())

from firebase_admin import auth
from app.config.firebase import db
from app.config import settings

async def create_admin():
    email = settings.admin_email
    password = "admin123"
    nombre = "Administrador Principal"
    
    print(f"🔄 Creando/Actualizando admin: {email}...")

    try:
        # 1. Firebase Auth
        try:
            user = auth.get_user_by_email(email)
            uid = user.uid
            print(f"✅ Usuario Auth encontrado (UID: {uid})")
            # Forzar actualización de contraseña
            auth.update_user(uid, password=password)
            print(f"🔑 Contraseña actualizada a: {password}")
        except auth.UserNotFoundError:
            user = auth.create_user(
                email=email,
                password=password,
                display_name=nombre
            )
            uid = user.uid
            print(f"✅ Usuario Auth creado (UID: {uid})")
            print(f"🔑 Password por defecto: {password}")

        # 2. Firestore
        user_data = {
            'uid': uid,
            'email': email,
            'nombre': nombre,
            'rol': 'admin',
            'es_admin': True,
            'activo': True,
            'fecha_registro': datetime.now()
        }
        
        # Merge para no borrar datos si ya existía
        db.collection('usuarios').document(uid).set(user_data, merge=True)
        print("✅ Documento en Firestore actualizado con rol 'admin'")
        print("\n🚀 ¡Listo! Ya puedes iniciar sesión.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_admin())
