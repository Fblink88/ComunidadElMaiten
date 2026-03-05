"""
Script automático para crear datos de prueba para Khipu.

Crea automáticamente:
- 1 departamento de prueba (si no existe)
- 3 pagos pendientes para probar Khipu

Uso:
    python -m app.scripts.setup_prueba_khipu
"""

import sys
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.config.firebase import db
from app.repositories import DepartamentoRepository


def setup_prueba_khipu():
    """
    Configura automáticamente datos de prueba para Khipu.
    """
    print("=" * 60)
    print("CONFIGURACIÓN AUTOMÁTICA DE PRUEBA PARA KHIPU")
    print("=" * 60)
    print()

    depto_repo = DepartamentoRepository()

    # Paso 1: Verificar o crear departamento
    print("Paso 1: Verificando departamentos...")
    print("-" * 60)

    departamentos = depto_repo.get_all()

    if departamentos:
        # Usar el primer departamento existente
        depto = departamentos[0]
        print(f"✅ Usando departamento existente:")
        print(f"   - Número: {depto.get('numero', 'N/A')}")
        print(f"   - Propietario: {depto.get('propietario', 'N/A')}")
        print(f"   - ID: {depto['id']}")
    else:
        # Crear un departamento de prueba
        print("No hay departamentos. Creando uno de prueba...")

        depto_data = {
            'numero': '101',
            'propietario': 'Usuario de Prueba',
            'metros_cuadrados': 50.0,
            'cuota_mensual': 50000,
            'activo': True,
            'usuarios_ids': [],
            'created_at': datetime.now()
        }

        depto = depto_repo.create(depto_data)
        print(f"✅ Departamento creado:")
        print(f"   - Número: {depto['numero']}")
        print(f"   - ID: {depto['id']}")

    print()

    # Paso 2: Crear pagos pendientes
    print("Paso 2: Creando pagos pendientes para Khipu...")
    print("-" * 60)

    depto_id = depto['id']
    periodos = [
        ("2025-01", 50000),
        ("2025-02", 50000),
        ("2025-03", 50000)
    ]

    pagos_creados = 0
    pagos_ref = db.collection('pagos')

    for periodo, monto in periodos:
        # Verificar si ya existe
        query = pagos_ref.where('departamento_id', '==', depto_id).where('periodo', '==', periodo)
        existente = list(query.stream())

        if existente:
            print(f"⚠️  {periodo}: Ya existe, saltando...")
            continue

        # Crear el pago
        pago_data = {
            'departamento_id': depto_id,
            'monto': monto,
            'periodo': periodo,
            'estado': 'pendiente',
            'metodo': 'khipu',
            'khipu_payment_id': None,
            'khipu_payment_url': None,
            'fecha_pago': None,
            'fecha_transferencia': None,
            'nombre_pagador': None,
            'verificado_por': None,
            'notas': None,
            'created_at': datetime.now()
        }

        pagos_ref.add(pago_data)
        print(f"✅ {periodo}: Pago de ${monto:,} creado")
        pagos_creados += 1

    print()
    print("=" * 60)
    print(f"✅ CONFIGURACIÓN COMPLETADA")
    print("=" * 60)
    print()
    print(f"Departamento: {depto.get('numero', 'N/A')} (ID: {depto['id']})")
    print(f"Pagos pendientes creados: {pagos_creados}")
    print()
    print("PRÓXIMOS PASOS:")
    print("-" * 60)
    print("1. Inicia el backend:")
    print("   uvicorn app.main:app --reload")
    print()
    print("2. Inicia el frontend:")
    print("   cd ../condominio-app")
    print("   npm run dev")
    print()
    print("3. Abre http://localhost:5173")
    print()
    print("4. Inicia sesión con tu usuario")
    print()
    print("5. Ve a '/dashboard/pagos'")
    print()
    print("6. Click en 'Pagar con Khipu'")
    print()
    print("¡Listo para probar Khipu! 🚀")
    print()


if __name__ == "__main__":
    try:
        setup_prueba_khipu()
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
