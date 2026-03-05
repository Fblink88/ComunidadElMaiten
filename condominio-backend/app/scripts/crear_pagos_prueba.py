"""
Script para crear pagos de prueba en Firestore.

Este script crea varios pagos de prueba con diferentes estados
para poder probar el flujo de pagos con Khipu.

Uso:
    python -m app.scripts.crear_pagos_prueba
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.config.firebase import db
from app.repositories import DepartamentoRepository


def crear_pagos_prueba():
    """
    Crea pagos de prueba en Firestore.
    """
    print("=" * 60)
    print("CREADOR DE PAGOS DE PRUEBA")
    print("=" * 60)
    print()

    # Obtener departamentos existentes
    depto_repo = DepartamentoRepository()
    departamentos = depto_repo.get_all()

    if not departamentos:
        print("❌ No hay departamentos en la base de datos.")
        print("   Primero debes crear al menos un departamento.")
        return

    # Mostrar departamentos disponibles
    print("Departamentos disponibles:")
    print("-" * 60)
    for i, depto in enumerate(departamentos, 1):
        print(f"{i}. Depto {depto.get('numero', 'N/A')} - "
              f"Propietario: {depto.get('propietario', 'N/A')} - "
              f"ID: {depto['id']}")
    print()

    # Seleccionar departamento
    while True:
        try:
            opcion = input(f"Selecciona un departamento (1-{len(departamentos)}) o '0' para todos: ")
            opcion = int(opcion)

            if opcion == 0:
                # Crear pagos para todos los departamentos
                deptos_seleccionados = departamentos
                break
            elif 1 <= opcion <= len(departamentos):
                # Crear pagos solo para el departamento seleccionado
                deptos_seleccionados = [departamentos[opcion - 1]]
                break
            else:
                print("❌ Opción inválida. Intenta de nuevo.")
        except ValueError:
            print("❌ Debes ingresar un número.")
        except KeyboardInterrupt:
            print("\n\n❌ Operación cancelada.")
            return

    print()
    print("Selecciona qué pagos crear:")
    print("-" * 60)
    print("1. Solo pagos pendientes (para probar Khipu)")
    print("2. Pagos con todos los estados (pendiente, verificando, pagado, rechazado)")
    print("3. Personalizado")
    print()

    try:
        tipo = input("Opción (1-3): ")
        tipo = int(tipo)
    except (ValueError, KeyboardInterrupt):
        print("\n❌ Operación cancelada.")
        return

    print()
    print("Creando pagos de prueba...")
    print("-" * 60)

    pagos_creados = 0

    for depto in deptos_seleccionados:
        depto_id = depto['id']
        depto_numero = depto.get('numero', 'N/A')

        if tipo == 1:
            # Solo pagos pendientes
            periodos = ["2025-01", "2025-02", "2025-03"]
            for periodo in periodos:
                crear_pago(depto_id, depto_numero, periodo, "pendiente", 50000)
                pagos_creados += 1

        elif tipo == 2:
            # Pagos con todos los estados
            pagos_config = [
                ("2025-01", "pendiente", 50000),
                ("2024-12", "verificando", 48000),
                ("2024-11", "pagado", 48000),
                ("2024-10", "rechazado", 48000),
            ]
            for periodo, estado, monto in pagos_config:
                crear_pago(depto_id, depto_numero, periodo, estado, monto)
                pagos_creados += 1

        elif tipo == 3:
            # Personalizado
            print(f"\nDepartamento {depto_numero} (ID: {depto_id})")
            try:
                cantidad = int(input("  ¿Cuántos pagos crear? "))
                for i in range(cantidad):
                    print(f"\n  Pago {i + 1}:")
                    periodo = input("    Periodo (YYYY-MM): ")
                    monto = int(input("    Monto: "))
                    print("    Estado: 1=pendiente, 2=verificando, 3=pagado, 4=rechazado")
                    estado_num = int(input("    Estado (1-4): "))
                    estados = ["pendiente", "verificando", "pagado", "rechazado"]
                    estado = estados[estado_num - 1] if 1 <= estado_num <= 4 else "pendiente"

                    crear_pago(depto_id, depto_numero, periodo, estado, monto)
                    pagos_creados += 1
            except (ValueError, KeyboardInterrupt):
                print("\n❌ Operación cancelada.")
                break

    print()
    print("=" * 60)
    print(f"✅ Se crearon {pagos_creados} pagos de prueba exitosamente!")
    print("=" * 60)
    print()
    print("Ahora puedes:")
    print("1. Iniciar sesión en el frontend")
    print("2. Ir a '/dashboard/pagos'")
    print("3. Ver tus pagos pendientes y probar el botón 'Pagar con Khipu'")
    print()


def crear_pago(depto_id: str, depto_numero: str, periodo: str, estado: str, monto: int):
    """
    Crea un pago en Firestore.

    Args:
        depto_id: ID del departamento
        depto_numero: Número del departamento (para logging)
        periodo: Periodo del pago (YYYY-MM)
        estado: Estado del pago
        monto: Monto del pago
    """
    # Verificar si ya existe un pago para ese periodo
    pagos_ref = db.collection('pagos')
    query = pagos_ref.where('departamento_id', '==', depto_id).where('periodo', '==', periodo)
    existente = list(query.stream())

    if existente:
        print(f"⚠️  Depto {depto_numero} - {periodo}: Ya existe, saltando...")
        return

    # Crear el pago
    pago_data = {
        'departamento_id': depto_id,
        'monto': monto,
        'periodo': periodo,
        'estado': estado,
        'metodo': 'khipu' if estado == 'pendiente' else 'transferencia_manual',
        'khipu_payment_id': None,
        'khipu_payment_url': None,
        'fecha_pago': None,
        'fecha_transferencia': None,
        'nombre_pagador': None,
        'verificado_por': None,
        'notas': None,
        'created_at': datetime.now()
    }

    # Agregar campos específicos según el estado
    if estado == 'pagado':
        pago_data['fecha_pago'] = datetime.now()
    elif estado == 'verificando':
        pago_data['fecha_transferencia'] = datetime.now()
        pago_data['nombre_pagador'] = "Usuario de Prueba"

    doc_ref = pagos_ref.add(pago_data)

    # Emoji según estado
    emoji = {
        'pendiente': '🟡',
        'verificando': '🔵',
        'pagado': '🟢',
        'rechazado': '🔴'
    }.get(estado, '⚪')

    print(f"✅ Depto {depto_numero} - {periodo} - ${monto:,} - {emoji} {estado}")


if __name__ == "__main__":
    try:
        crear_pagos_prueba()
    except KeyboardInterrupt:
        print("\n\n❌ Script cancelado por el usuario.")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
