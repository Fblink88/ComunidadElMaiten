"""
Configuración de la Aplicación.

Este archivo carga y valida las variables de entorno usando Pydantic.
Sirve para centralizar toda la configuración en un solo lugar,
con validación automática de tipos y valores por defecto.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """
    Clase de configuración que carga variables desde .env
    
    Pydantic automáticamente:
    - Busca las variables en el archivo .env
    - Convierte los tipos (str a bool, str a list, etc.)
    - Valida que existan las variables requeridas
    """
    
    # Configuración del servidor
    app_env: str = "development"
    app_debug: bool = True
    
    # Firebase
    firebase_credentials_path: str = "./firebase-credentials.json"
    firebase_project_id: str = "comunidadelmaiten"
    
    # CORS - Orígenes permitidos para el frontend
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """
        Convierte la cadena de orígenes CORS en una lista.
        
        Returns:
            Lista de URLs permitidas para CORS
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    @property
    def is_development(self) -> bool:
        """
        Verifica si estamos en modo desarrollo.
        
        Returns:
            True si app_env es 'development'
        """
        return self.app_env == "development"
    
    class Config:
        """Configuración de Pydantic para cargar el archivo .env"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Instancia global de configuración
# Se importa así: from app.config import settings
settings = Settings()