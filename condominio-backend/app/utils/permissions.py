"""
Utilidades de Permisos.

Este archivo contiene funciones auxiliares para verificar
permisos de usuarios sobre recursos.
"""

from typing import Dict, Any


def verificar_permiso_departamento(
    usuario: Dict[str, Any],
    departamento_id: str
) -> bool:
    """
    Verifica si un usuario tiene permiso sobre un departamento.
    
    Un usuario tiene permiso si:
    - Es administrador, o
    - Pertenece a ese departamento
    
    Args:
        usuario: Diccionario con los datos del usuario
        departamento_id: ID del departamento
        
    Returns:
        True si tiene permiso
    """
    if usuario.get('es_admin', False):
        return True
    
    return usuario.get('departamento_id') == departamento_id


def verificar_permiso_edicion_usuario(
    usuario_solicitante: Dict[str, Any],
    usuario_objetivo_id: str
) -> bool:
    """
    Verifica si un usuario puede editar a otro usuario.
    
    Un usuario puede editar si:
    - Es administrador, o
    - Es el mismo usuario (solo datos básicos)
    
    Args:
        usuario_solicitante: Usuario que quiere editar
        usuario_objetivo_id: ID del usuario a editar
        
    Returns:
        True si tiene permiso
    """
    if usuario_solicitante.get('es_admin', False):
        return True
    
    return usuario_solicitante.get('id') == usuario_objetivo_id


def es_propietario_departamento(
    usuario: Dict[str, Any],
    departamento_id: str
) -> bool:
    """
    Verifica si un usuario es propietario de un departamento.
    
    Args:
        usuario: Diccionario con los datos del usuario
        departamento_id: ID del departamento
        
    Returns:
        True si es propietario del departamento
    """
    return (
        usuario.get('rol') == 'propietario' and
        usuario.get('departamento_id') == departamento_id
    )