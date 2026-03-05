import os
import sys

# Añadir el directorio raíz al path para poder importar la app
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, '..', '..')
sys.path.append(app_dir)

# Importamos primero firebase para inicializar
from app.config.firebase import db
from app.repositories import DepartamentoRepository
from firebase_admin import auth

def actualizar_departamentos():
    archivo_md = os.path.join(app_dir, '..', 'diccionario_datos_comunidad.md')
    
    if not os.path.exists(archivo_md):
        print(f"Error: No se encontró el archivo en {archivo_md}")
        return

    with open(archivo_md, 'r', encoding='utf-8') as file:
        lineas = file.readlines()

    depto_repo = DepartamentoRepository()
    deptos_db = depto_repo.get_all()
    mapa_deptos = { d['numero']: d['id'] for d in deptos_db }
    
    print("\n--- ACTUALIZANDO NOMBRES DE DEPARTAMENTOS ---")
    
    en_deptos = False
    actualizados = 0
    
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()
        
        if "## 1. Colección: `departamentos`" in linea:
            en_deptos = True
        elif "## 2. Colección:" in linea:
            break
            
        if en_deptos:
            if linea.startswith("|") and "Propietario Real" not in linea and "---" not in linea:
                cols = [c.strip() for c in linea.split('|')[1:-1]]
                if len(cols) >= 4 and cols[0] != '-':
                    numero = cols[0]
                    propietario = cols[1]
                    try:
                        m2 = float(cols[2])
                        cuota = int(cols[3])
                    except ValueError:
                        i += 1
                        continue
                        
                    doc_id = mapa_deptos.get(numero)
                    if doc_id:
                        try:
                            # 1. Actualizar Departamento
                            depto_repo.update(doc_id, {
                                'propietario': propietario,
                                'metros_cuadrados': m2,
                                'cuota_mensual': cuota
                            })
                            print(f"✅ Depto {numero} actualizado: Propietario -> {propietario}, {m2}m2, ${cuota}")
                            
                            # 2. Actualizar Usuario asociado (si existe)
                            usuarios_ref = db.collection('usuarios')
                            # Buscamos al propietario de este departamento
                            users_query = usuarios_ref.where('departamento_id', '==', doc_id).where('rol', '==', 'propietario').stream()
                            
                            for u in users_query:
                                # Actualizar en Firestore
                                usuarios_ref.document(u.id).update({'nombre': propietario})
                                # Actualizar en Firebase Auth
                                try:
                                    auth.update_user(u.id, display_name=propietario)
                                except Exception as e:
                                    pass
                                print(f"  -> Usuario {u.to_dict().get('email')} renombrado a {propietario}")
                                
                            actualizados += 1
                        except Exception as e:
                            print(f"❌ Error actualizando depto {numero}: {e}")
                    else:
                        print(f"⚠️ Depto {numero} no encontrado en base de datos. Se omite.")
        i += 1

    print(f"\nResumen: {actualizados} Departamentos actualizados exitosamente.\n")

if __name__ == "__main__":
    print("Iniciando actualización de departamentos...")
    actualizar_departamentos()
