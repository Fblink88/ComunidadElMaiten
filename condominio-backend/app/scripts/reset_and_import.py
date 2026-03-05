import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import auth, firestore

# Asegurar que el directorio raíz está en el path
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, '..', '..')
sys.path.append(app_dir)

from app.config.firebase import db
from app.repositories import DepartamentoRepository
from app.services import GastoService, PagoService, UsuarioService
from app.models import GastoMensualCreate, ItemGasto, UsuarioCreate, RolUsuario

def limpiar_base_datos():
    print("🧹 1. Limpiando base de datos completamente...")
    collections = ['pagos', 'gastos_mensuales', 'gastos_extraordinarios', 'usuarios', 'departamentos', 'transacciones', 'autorizaciones']
    
    for coll_name in collections:
        docs = db.collection(coll_name).stream()
        for doc in docs:
            db.collection(coll_name).document(doc.id).delete()
            
            if coll_name == 'usuarios':
                try:
                    auth.delete_user(doc.id)
                except:
                    pass
    print("✅ Base de datos limpia.")

def recreate_admin():
    print("👨‍💻 2. Re-creando usuario Administrador...")
    admin_email = "edificio.elmaiten@gmail.com"
    admin_pass = "admin123456"
    user_service = UsuarioService()
    try:
        user = auth.create_user(email=admin_email, password=admin_pass, display_name="Administrador")
        uid = user.uid
    except auth.EmailAlreadyExistsError:
        user = auth.get_user_by_email(admin_email)
        uid = user.uid

    user_service.usuario_repo.create_with_uid(uid, {
        "email": admin_email,
        "nombre": "Administrador General",
        "rol": "admin",
        "es_admin": True,
        "activo": True,
        "departamento_id": None
    })
    return {"id": uid, "email": admin_email, "es_admin": True, "rol": "admin"}


def procesar_diccionario(admin_usuario):
    archivo_md = os.path.join(app_dir, '..', 'diccionario_datos_comunidad.md')
    with open(archivo_md, 'r', encoding='utf-8') as file:
        lineas = file.readlines()

    depto_repo = DepartamentoRepository()
    gasto_service = GastoService()
    pago_service = PagoService()
    usuarios_ref = db.collection('usuarios')

    print("\n🏢 3. Procesando Departamentos y Usuarios...")
    en_deptos = False
    mapa_deptos = {}
    
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()
        if "## 1. Colección: `departamentos`" in linea:
            en_deptos = True
        elif "## 2. Colección:" in linea:
            en_deptos = False
            
        if en_deptos and linea.startswith("|") and "Propietario Real" not in linea and "---" not in linea:
            cols = [c.strip() for c in linea.split('|')[1:-1]]
            if len(cols) >= 4 and cols[0] != '-':
                numero = cols[0]
                propietario = cols[1]
                m2 = float(cols[2])
                cuota = int(cols[3])
                saldo = int(cols[4]) if len(cols) > 4 else 0
                
                depto_data = {
                    'numero': numero,
                    'propietario': propietario,
                    'metros_cuadrados': m2,
                    'cuota_mensual': cuota,
                    'saldo_a_favor': saldo,
                    'activo': True,
                    'usuarios_ids': []
                }
                nuevo_depto = depto_repo.create(depto_data)
                mapa_deptos[numero] = nuevo_depto['id']
                
                # Crear el usuario en auth y firestore
                email = f"depto{numero}@elmaiten.cl"
                password = f"Maiten{numero}"
                try:
                    user_auth = auth.create_user(email=email, password=password, display_name=propietario)
                    uid = user_auth.uid
                except auth.EmailAlreadyExistsError:
                    user_auth = auth.get_user_by_email(email)
                    uid = user_auth.uid
                
                usuario_data = {
                    'uid': uid,
                    'email': email,
                    'nombre': propietario,
                    'departamento_id': nuevo_depto['id'],
                    'rol': 'propietario',
                    'es_admin': False,
                    'activo': True,
                    'fecha_registro': datetime.now()
                }
                usuarios_ref.document(uid).set(usuario_data)
                depto_repo.update(nuevo_depto['id'], {'usuarios_ids': [uid]})
                print(f"  ✅ Depto {numero} ({propietario}) + Usuario creado.")
        i += 1

    print("\n💰 4. Procesando Gastos Mensuales (Generarán Deudas)...")
    en_gastos = False
    periodo_actual = None
    fecha_venc_actual = None
    items_actuales = []
    
    def guardar_gasto_actual():
        if periodo_actual and items_actuales:
            nuevo_gasto = GastoMensualCreate(
                periodo=periodo_actual,
                fecha_vencimiento=datetime.strptime(fecha_venc_actual, "%Y-%m-%d"),
                items=items_actuales,
                observaciones=f"Importado"
            )
            gasto_service.crear_gasto_mensual(nuevo_gasto, admin_usuario)
            print(f"  ✅ Gasto Creado: {periodo_actual} ({len(items_actuales)} ítems)")

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
                guardar_gasto_actual()
                periodo_actual = linea.replace("**Mes/Periodo:** `", "").replace("`", "")
                items_actuales = []
            elif linea.startswith("**Fecha Vencimiento:** `"):
                fecha_venc_actual = linea.replace("**Fecha Vencimiento:** `", "").replace("`", "")
            elif linea.startswith("|") and "Nombre del Ítem" not in linea and "---" not in linea:
                cols = [c.strip() for c in linea.split('|')[1:-1]]
                if len(cols) == 2 and cols[0] != '-' and cols[1] != '-' and cols[1].isdigit():
                    items_actuales.append(ItemGasto(concepto=cols[0], monto=int(cols[1])))
        i += 1

    print("\n💳 5. Procesando Abonos a Billetera Virtual (Actualiza deudas en cascada)...")
    en_transacciones = False
    
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()
        if "## 7. Colección: `transacciones`" in linea:
            en_transacciones = True
            
        if en_transacciones and linea.startswith("|") and "Departamento" not in linea and "---" not in linea:
            cols = [c.strip() for c in linea.split('|')[1:-1]]
            if len(cols) >= 3 and cols[0] != '-':
                depto_num = cols[0]
                fecha_str = cols[1]
                monto = int(cols[2])
                notas = cols[3] if len(cols) > 3 else "Importado"
                
                doc_id = mapa_deptos.get(depto_num)
                if doc_id and monto > 0:
                    pago_service.procesar_abono_cascada(
                        departamento_id=doc_id,
                        monto_abono=monto,
                        notas=f"{notas} (Fecha original: {fecha_str})",
                        metodo="importacion_historica",
                        referencia=f"import2025_{depto_num}_{fecha_str}"
                    )
                    # Forzamos la fecha manipulando directamente
                    # La cascada crea la transacción y actualiza las deudas.
                    print(f"  ✅ Abono procesado: Depto {depto_num} por ${monto}")
                elif doc_id and monto < 0:
                    depto_repo.actualizar_saldo(doc_id, monto)
                    print(f"  ℹ️ Devolución procesada: Depto {depto_num} por ${monto}")
        i += 1

if __name__ == "__main__":
    print("\n🚀 INICIANDO RESET Y RECARGA ESTRICTA DE LA BASE DE DATOS...")
    in_user = input("Esto borrará la BD y cargará datos desde MD. ¿Continuar? (s/n): ")
    if in_user.lower() == 's':
        limpiar_base_datos()
        admin_u = recreate_admin()
        procesar_diccionario(admin_u)
        print("\n🎉 PROCESO FINALIZADO EXITOSAMENTE.\n")
    else:
        print("Cancelado.")
