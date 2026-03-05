# Scripts de Desarrollo

Esta carpeta contiene scripts útiles para desarrollo y pruebas.

## Scripts Disponibles

### 1. Crear Departamento de Prueba

Crea un departamento de prueba en Firestore si no tienes ninguno.

```bash
cd condominio-backend
source venv/bin/activate
python -m app.scripts.crear_departamento_prueba
```

**Qué hace:**
- Verifica si ya existen departamentos
- Te pide los datos del nuevo departamento
- Lo crea en Firestore
- Muestra el ID del departamento creado

### 2. Crear Pagos de Prueba

Crea pagos de prueba para probar el flujo de pagos con Khipu.

```bash
cd condominio-backend
source venv/bin/activate
python -m app.scripts.crear_pagos_prueba
```

**Qué hace:**
- Muestra todos los departamentos disponibles
- Te permite seleccionar uno o todos
- Te permite elegir qué tipo de pagos crear:
  - Solo pagos pendientes (ideal para probar Khipu)
  - Pagos con todos los estados
  - Personalizado
- Crea los pagos en Firestore

**Opciones:**

1. **Solo pagos pendientes**: Crea 3 pagos pendientes (Enero, Febrero, Marzo 2025)
2. **Todos los estados**: Crea 4 pagos con estados diferentes para pruebas completas
3. **Personalizado**: Tú decides cuántos pagos y con qué datos

## Orden Recomendado

Si empiezas desde cero:

1. **Primero**: Ejecuta `crear_departamento_prueba.py` para crear un departamento
2. **Segundo**: Ejecuta `crear_pagos_prueba.py` para crear pagos de prueba
3. **Tercero**: Inicia sesión en el frontend y prueba el flujo de Khipu

## Notas

- Estos scripts usan las mismas credenciales de Firebase que el backend
- Asegúrate de que `firebase-credentials.json` esté en la raíz del proyecto backend
- Los pagos creados son solo para pruebas, puedes eliminarlos después desde Firebase Console
