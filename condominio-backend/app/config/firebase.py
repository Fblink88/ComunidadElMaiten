"""
Configuración de Firebase Admin SDK.

Este archivo inicializa la conexión con Firebase usando credenciales
de servicio (Service Account). Esto permite al backend:
- Verificar tokens de autenticación de usuarios
- Leer y escribir en Firestore con permisos de administrador
- Realizar operaciones que el frontend no puede hacer directamente

IMPORTANTE: Las credenciales de Firebase Admin son SECRETAS.
Nunca deben subirse a Git ni exponerse en el frontend.
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
from .settings import settings
import os


def initialize_firebase():
    """
    Inicializa Firebase Admin SDK.
    
    Esta función verifica si Firebase ya está inicializado para evitar
    errores de doble inicialización. Carga las credenciales desde
    el archivo JSON especificado en las variables de entorno.
    
    Returns:
        tuple: (firestore_client, auth_module)
    
    Raises:
        FileNotFoundError: Si el archivo de credenciales no existe
        ValueError: Si las credenciales son inválidas
    """
    
    # Verificar si ya está inicializado
    if not firebase_admin._apps:
        # Verificar que el archivo de credenciales existe
        cred_path = settings.firebase_credentials_path
        
        if not os.path.exists(cred_path):
            raise FileNotFoundError(
                f"Archivo de credenciales Firebase no encontrado: {cred_path}\n"
                f"Descárgalo desde Firebase Console > Project Settings > Service Accounts"
            )
        
        # Inicializar con las credenciales
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            "projectId": settings.firebase_project_id
        })
    
    # Retornar clientes de Firestore y Auth
    return firestore.client(), auth


# Inicializar Firebase y exportar los clientes
db, firebase_auth = initialize_firebase()