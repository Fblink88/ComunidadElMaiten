"""
Script para crear un departamento de prueba en Firestore.

Si no tienes departamentos, este script crea uno para poder
probar el sistema de pagos.

Uso:
    python -m app.scripts.crear_departamento_prueba
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.repositories import DepartamentoRepository


def crear_departamento_prueba():
    """
    Crea un departamento de prueba en Firestore.
    """
    print("=" * 60)
    print("CREADOR DE DEPARTAMENTO DE PRUEBA")
    print("=" * 60)
    print()

    depto_repo = DepartamentoRepository()

    # Verificar si ya existen departamentos
    departamentos = depto_repo.get_all()

    if departamentos:
        print("Departamentos existentes:")
        print("-" * 60)
        for depto in departamentos:
            print(f"- Depto {depto.get('numero', 'N/A')} - "
                  f"Propietario: {depto.get('propietario', 'N/A')} - "
                  f"ID: {depto['id']}")
        print()
        print("✅ Ya tienes departamentos. No es necesario crear uno de prueba.")
        respuesta = input("\n¿Quieres crear otro departamento de todas formas? (s/n): ")
        if respuesta.lower() != 's':
            return

    print()
    print("Ingresa los datos del departamento:")
    print("-" * 60)

    try:
        numero = input("Número del departamento (ej: 101): ")
        propietario = input("Nombre del propietario: ")
        metros_cuadrados = float(input("Metros cuadrados (ej: 45.5): "))
        cuota_mensual = int(input("Cuota mensual base (ej: 50000): "))
    except (ValueError, KeyboardInterrupt):
        print("\n❌ Operación cancelada.")
        return

    # Crear el departamento
    depto_data = {
        'numero': numero,
        'propietario': propietario,
        'metros_cuadrados': metros_cuadrados,
        'cuota_mensual': cuota_mensual,
        'activo': True,
        'usuarios_ids': [],
        'created_at': datetime.now()
    }

    try:
        nuevo_depto = depto_repo.create(depto_data)

        print()
        print("=" * 60)
        print("✅ Departamento creado exitosamente!")
        print("=" * 60)
        print()
        print(f"ID: {nuevo_depto['id']}")
        print(f"Número: {nuevo_depto['numero']}")
        print(f"Propietario: {nuevo_depto['propietario']}")
        print(f"Metros cuadrados: {nuevo_depto['metros_cuadrados']} m²")
        print(f"Cuota mensual: ${nuevo_depto['cuota_mensual']:,}")
        print()
        print("Ahora puedes:")
        print("1. Ejecutar: python -m app.scripts.crear_pagos_prueba")
        print("2. Crear pagos de prueba para este departamento")
        print()

    except Exception as e:
        print(f"\n❌ Error al crear departamento: {str(e)}")


if __name__ == "__main__":
    try:
        crear_departamento_prueba()
    except KeyboardInterrupt:
        print("\n\n❌ Script cancelado por el usuario.")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
