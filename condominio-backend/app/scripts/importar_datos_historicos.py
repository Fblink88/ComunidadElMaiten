import os
import sys
from datetime import datetime

# Añadir el directorio raíz al path para poder importar la app
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, '..', '..')
sys.path.append(app_dir)

# Importamos primero firebase para inicializar
from app.config.firebase import db
from app.services.gasto_service import GastoService
from app.services.pago_service import PagoService
from app.repositories import DepartamentoRepository
from app.models import GastoMensualCreate, ItemGasto

def procesar_diccionario():
    archivo_md = os.path.join(app_dir, '..', 'diccionario_datos_comunidad.md')
    
    if not os.path.exists(archivo_md):
        print(f"Error: No se encontró el archivo en {archivo_md}")
        return

    with open(archivo_md, 'r', encoding='utf-8') as file:
        lineas = file.readlines()

    gasto_service = GastoService()
    pago_service = PagoService()
    depto_repo = DepartamentoRepository()
    
    admin_usuario = {
        'id': 'system_importer',
        'email': 'edificio.elmaiten@gmail.com',
        'es_admin': True,
        'rol': 'admin'
    }

    # 1. PARSEAR Y CREAR GASTOS MENSUALES
    print("\n--- 1. PROCESANDO GASTOS MENSUALES (Colección 3) ---")
    
    en_gastos = False
    periodo_actual = None
    fecha_venc_actual = None
    items_actuales = []
    
    gastos_creados = 0
    
    def guardar_gasto_actual():
        nonlocal gastos_creados
        if periodo_actual and items_actuales:
            try:
                existente = gasto_service.obtener_gasto_mensual(periodo_actual)
                if existente:
                    print(f"⏩ Gasto mensual para {periodo_actual} ya existe. Saltando.")
                else:
                    nuevo_gasto = GastoMensualCreate(
                        periodo=periodo_actual,
                        fecha_vencimiento=datetime.strptime(fecha_venc_actual, "%Y-%m-%d"),
                        items=items_actuales,
                        observaciones=f"Importado desde diccionario_datos_comunidad.md"
                    )
                    gasto_service.crear_gasto_mensual(nuevo_gasto, admin_usuario)
                    print(f"✅ Gasto creado para: {periodo_actual} con {len(items_actuales)} ítems.")
                    gastos_creados += 1
            except Exception as e:
                print(f"❌ Error guardando gasto {periodo_actual}: {e}")

    # Parseo linea a linea secuencial
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()
        
        if "## 3. Colección: `gastos_mensuales`" in linea:
            en_gastos = True
        elif "## 4. Colección:" in linea:
            guardar_gasto_actual()
            en_gastos = False
            
        if en_gastos:
            if linea.startswith("**Mes/Periodo:** `"):
                guardar_gasto_actual() # Guarda el anterior si había
                periodo_actual = linea.replace("**Mes/Periodo:** `", "").replace("`", "")
                items_actuales = []
            elif linea.startswith("**Fecha Vencimiento:** `"):
                fecha_venc_actual = linea.replace("**Fecha Vencimiento:** `", "").replace("`", "")
            elif linea.startswith("|") and "Nombre del Ítem" not in linea and "---" not in linea:
                cols = [c.strip() for c in linea.split('|')[1:-1]]
                if len(cols) == 2 and cols[0] != '-' and cols[1] != '-' and cols[1].isdigit():
                    items_actuales.append(ItemGasto(concepto=cols[0], monto=int(cols[1])))
        i += 1

    print(f"\nResumen: {gastos_creados} Gastos Mensuales creados.")


    # 2. PARSEAR ABONOS (TRANSACCIONES)
    print("\n--- 2. PROCESANDO ABONOS DE BILLETERA VIRTUAL (Colección 7) ---")
    en_transacciones = False
    abonos_procesados = 0
    devoluciones = 0
    
    # Pre-cargar deptos para lookup rapido
    deptos_db = depto_repo.get_all()
    mapa_deptos = { d['numero']: d['id'] for d in deptos_db }
    
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()
        
        if "## 7. Colección: `transacciones`" in linea:
            en_transacciones = True
            
        if en_transacciones:
            if linea.startswith("|") and "Departamento" not in linea and "---" not in linea:
                cols = [c.strip() for c in linea.split('|')[1:-1]]
                if len(cols) >= 3 and cols[0] != '-':
                    depto_num = cols[0]
                    fecha_str = cols[1]
                    try:
                        monto = int(cols[2])
                    except ValueError:
                        i += 1
                        continue
                        
                    notas = cols[3] if len(cols) > 3 else "Importado desde MD"
                    
                    doc_id_depto = mapa_deptos.get(depto_num)
                    if not doc_id_depto:
                        print(f"❌ Depto {depto_num} no hallado en BD.")
                        i += 1
                        continue
                        
                    if monto > 0:
                        try:
                            pago_service.procesar_abono_cascada(
                                departamento_id=doc_id_depto,
                                monto_abono=monto,
                                notas=f"{notas} (Fecha original: {fecha_str})",
                                metodo="importacion_historica",
                                referencia=f"import2025_{depto_num}_{fecha_str}_{abonos_procesados}"
                            )
                            print(f"✅ Abono procesado: Depto {depto_num} por ${monto} ({fecha_str})")
                            abonos_procesados += 1
                        except Exception as e:
                            print(f"❌ Error abono Depto {depto_num}: {e}")
                    else:
                        try:
                            depto_repo.actualizar_saldo(doc_id_depto, monto)
                            print(f"ℹ️ Devolución procesada: Depto {depto_num} por ${monto} ({fecha_str})")
                            devoluciones += 1
                        except Exception as e:
                            print(f"❌ Error devolución Depto {depto_num}: {e}")
        i += 1

    print(f"\nResumen: {abonos_procesados} Abonos y {devoluciones} Devoluciones procesadas existosamente.\n")


if __name__ == "__main__":
    print("Iniciando importación histórica 2025 para Billetera Virtual...")
    print("---------------------------------------------------------------")
    procesar_diccionario()
    print("\nProceso Finalizado.")
