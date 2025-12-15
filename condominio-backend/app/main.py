"""
Punto de Entrada de la Aplicación.

Este archivo configura e inicializa la aplicación FastAPI,
registra los routers y configura los middlewares.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.controllers import (
    auth_router,
    departamento_router,
    usuario_router,
    pago_router,
    gasto_router
)

# Crear instancia de FastAPI
app = FastAPI(
    title="API Condominio El Maitén",
    description="API para gestión de gastos comunes del condominio",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Registrar routers
app.include_router(auth_router, prefix="/api")
app.include_router(departamento_router, prefix="/api")
app.include_router(usuario_router, prefix="/api")
app.include_router(pago_router, prefix="/api")
app.include_router(gasto_router, prefix="/api")


@app.get("/")
async def root():
    """
    Endpoint raíz para verificar que la API está funcionando.
    """
    return {
        "message": "API Condominio El Maitén",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Endpoint de health check para monitoreo.
    """
    return {"status": "healthy"}