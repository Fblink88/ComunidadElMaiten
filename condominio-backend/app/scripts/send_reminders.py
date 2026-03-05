"""
Script para enviar recordatorios de pago.

Busca pagos pendientes del periodo actual y envía correos a los propietarios.

Uso:
    python -m app.scripts.send_reminders
"""

import sys
import asyncio
from pathlib import Path
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.repositories import PagoRepository, UsuarioRepository, DepartamentoRepository
from app.services.email_service import email_service

async def enviar_recordatorios():
    """
    Función principal para enviar recordatorios.
    """
    print("=" * 60)
    print("ENVIANDO RECORDATORIOS DE PAGO")
    print("=" * 60)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Repositorios
    pago_repo = PagoRepository()
    usuario_repo = UsuarioRepository()
    depto_repo = DepartamentoRepository()

    # Obtener pagos pendientes
    # Opcional: Filtrar por periodo actual si se desea
    # now = datetime.now()
    # periodo_actual = f"{now.year}-{now.month:02d}"
    
    pagos_pendientes = pago_repo.get_pendientes()
    
    if not pagos_pendientes:
        print("✅ No hay pagos pendientes para gestionar.")
        return

    print(f"Se encontraron {len(pagos_pendientes)} pagos pendientes.")
    print("-" * 60)

    cont_enviados = 0
    cont_errores = 0
    cont_sin_email = 0

    for pago in pagos_pendientes:
        try:
            depto_id = pago.get('departamento_id')
            monto = pago.get('monto', 0)
            periodo = pago.get('periodo')
            
            # Obtener datos del departamento
            depto = depto_repo.get_by_id(depto_id)
            if not depto:
                print(f"⚠️ Depto {depto_id} no encontrado para pago {pago['id']}")
                continue

            numero_depto = depto.get('numero', 'Desconocido')

            # Buscar al propietario (Usuario)
            # Primero buscamos usuarios asociados al departamento con rol de propietario
            usuarios = usuario_repo.get_by_departamento(depto_id)
            propietario = next((u for u in usuarios if u.get('rol') == 'propietario'), None)
            
            # Si no hay propietario explícito, tomamos cualquier usuario asociado (arrendatario?)
            # Ojo con la política: ¿Recordar al arrendatario o al dueño?
            # Asumiremos prioridad: Propietario -> Arrendatario -> Email en Depto (si hubiera)
            if not propietario and usuarios:
                propietario = usuarios[0]

            if not propietario or not propietario.get('email'):
                print(f"⚠️ No hay usuario/email válido para Depto {numero_depto}")
                cont_sin_email += 1
                continue

            email = propietario.get('email')
            nombre = propietario.get('nombre', 'Vecino')

            print(f"📧 Enviando a {email} (Depto {numero_depto}, {periodo})...", end=" ")

            # Enviar correo
            resultado = await email_service.enviar_recordatorio_pago(
                email_destinatario=email,
                nombre_destinatario=nombre,
                periodo=periodo,
                monto=monto,
                numero_departamento=numero_depto
            )

            if resultado.get('success'):
                print("✅ Enviado")
                cont_enviados += 1
            else:
                print(f"❌ Error: {resultado.get('message')}")
                cont_errores += 1

        except Exception as e:
            print(f"\n❌ Error procesando pago {pago.get('id')}: {str(e)}")
            cont_errores += 1

    print("-" * 60)
    print("Resumen:")
    print(f"✅ Enviados: {cont_enviados}")
    print(f"⚠️ Sin email: {cont_sin_email}")
    print(f"❌ Errores: {cont_errores}")
    print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(enviar_recordatorios())
    except KeyboardInterrupt:
        print("\n\n❌ Script cancelado.")
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
