import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(current_dir, '..', '..')
sys.path.append(app_dir)

from app.repositories import PagoRepository
from app.models.pago import PagoResponse

repo = PagoRepository()
pagos = repo.get_all(limit=200)

errores = 0
for p in pagos:
    try:
        PagoResponse(**p)
    except Exception as e:
        print(f"\n❌ Error validando pago ID: {p.get('id')} - Depto: {p.get('departamento_id')} - Periodo: {p.get('periodo')} - Metodo: {p.get('metodo')}")
        print(e)
        errores += 1
        if errores >= 5:
            break

if errores == 0:
    print("✅ Todos los pagos validaron correctamente.")
else:
    print(f"\nTotal errores mostrados: {errores}")
