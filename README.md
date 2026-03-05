# Sistema de Gestión de Gastos Comunes - Comunidad El Maitén

Sistema web completo para la administración de gastos comunes en condominios. Diseñado para facilitar la gestión de pagos, control de gastos mensuales y extraordinarios, y comunicación entre administradores y residentes.

## Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)

## Características

### Para Administradores
- ✅ Gestión completa de departamentos y residentes
- ✅ Registro y control de gastos mensuales y extraordinarios
- ✅ Cálculo automático de gastos por metro cuadrado
- ✅ Verificación y seguimiento de pagos
- 🔄 Panel de administración con dashboard completo
- 🔄 Generación de reportes financieros

### Para Residentes
- ✅ Visualización de gastos comunes mensuales
- ✅ Historial de pagos y estado de cuenta
- 🔄 Pago en línea mediante Flow
- 🔄 Notificaciones de nuevos gastos y vencimientos
- 🔄 Envío de reportes y reclamos

### Características Técnicas
-  Autenticación segura con Firebase Authentication
-  API RESTful completa y documentada
-  Interfaz responsive (móvil, tablet, desktop)
-  Diseño moderno con Tailwind CSS
-  Validación de datos en frontend y backend
-  Base de datos en tiempo real con Firestore

**Leyenda:** ✅ Implementado | 🔄 En desarrollo

## 🛠️ Tecnologías

### Frontend
- **React 19** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **TanStack Query** - Gestión de estado servidor
- **Zustand** - State management ligero
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Tailwind CSS** - Estilos utilitarios
- **Lucide React** - Iconos
- **Firebase SDK** - Autenticación

### Backend
- **Python 3.12+** - Lenguaje
- **FastAPI** - Framework web asíncrono
- **Pydantic** - Validación de datos
- **Firebase Admin SDK** - Autenticación y Firestore
- **Uvicorn** - Servidor ASGI

### Infraestructura
- **Firebase Authentication** - Gestión de usuarios
- **Cloud Firestore** - Base de datos NoSQL
- **Flow** - Pasarela de pago (en integración)

## 🏗️ Arquitectura

### Frontend - Feature-Sliced Design (FSD)

El proyecto frontend sigue la metodología [Feature-Sliced Design](https://feature-sliced.design/), una arquitectura moderna que organiza el código por features y propósito:

```
src/
├── app/           # Configuración global de la aplicación
│   ├── providers/ # Context providers (Auth, Theme, etc.)
│   ├── router/    # Configuración de rutas
│   └── styles/    # Estilos globales
├── pages/         # Páginas/vistas de la aplicación
├── widgets/       # Bloques de UI complejos (Header, Sidebar)
├── features/      # Funcionalidades del negocio (auth, pagos)
├── entities/      # Entidades del dominio (usuario, departamento)
└── shared/        # Código reutilizable (UI, utils, config)
```

### Backend - Arquitectura en Capas

```
app/
├── controllers/   # Endpoints y validación de requests
├── services/      # Lógica de negocio
├── repositories/  # Acceso a datos (Firestore)
├── models/        # Schemas Pydantic
├── middleware/    # Autenticación y validaciones
├── config/        # Configuración y variables de entorno
└── utils/         # Utilidades y helpers
```

### Flujo de Datos

```
Cliente → Controller → Service → Repository → Firestore
         ↓           ↓         ↓           ↓
    Validación   Lógica   Transformación Persistencia
```

## Requisitos Previos

- **Node.js** 18+ y npm/pnpm/yarn
- **Python** 3.12+
- **Cuenta Firebase** con proyecto configurado
- **Git** para control de versiones

##  Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ComunidadElMaiten.git
cd ComunidadElMaiten
```

### 2. Configurar Backend

```bash
cd condominio-backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En macOS/Linux:
source .venv/bin/activate
# En Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar Frontend

```bash
cd condominio-app

# Instalar dependencias
npm install
# o
pnpm install
# o
yarn install
```

##  Configuración

### Backend

1. **Crear archivo `.env`** en `condominio-backend/`:

```bash
cp .env.example .env
```

2. **Configurar variables de entorno**:

```env
# Configuración del servidor
APP_ENV=development
APP_DEBUG=true

# Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=tu_project_id

# CORS - Orígenes permitidos
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. **Descargar credenciales de Firebase**:
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Selecciona tu proyecto
   - Ve a **Project Settings** > **Service Accounts**
   - Click en **Generate New Private Key**
   - Guarda el archivo como `firebase-credentials.json` en `condominio-backend/`

### Frontend

1. **Crear archivo `.env`** en `condominio-app/`:

```bash
cp .env.example .env
```

2. **Configurar variables de Firebase**:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

Para obtener estas credenciales:
- Firebase Console > Project Settings > General
- Sección "Your apps" > Web app

### Configuración de Firebase

1. **Habilitar Authentication**:
   - Firebase Console > Authentication > Sign-in method
   - Habilitar "Email/Password"

2. **Crear base de datos Firestore**:
   - Firebase Console > Firestore Database
   - Crear base de datos en modo de prueba
   - Configurar reglas de seguridad (ver sección siguiente)

3. **Reglas de Firestore** (ejemplo básico):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios autenticados pueden leer su propio documento
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Solo admins pueden gestionar departamentos
    match /departamentos/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.esAdmin == true;
    }
    
    // Gastos visibles para todos los autenticados
    match /gastos_mensuales/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.esAdmin == true;
    }
    
    // Pagos: usuarios pueden ver y crear los suyos
    match /pagos/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.esAdmin == true;
    }
  }
}
```

##  Uso

### Desarrollo

#### Backend

```bash
cd condominio-backend
source .venv/bin/activate  # Activar entorno virtual
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en:
- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc

#### Frontend

```bash
cd condominio-app
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

### Producción

#### Backend

```bash
# Con variables de producción
APP_ENV=production uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
# Build
npm run build

# Preview del build
npm run preview
```

## 📁 Estructura del Proyecto

```
ComunidadElMaiten/
├── condominio-app/              # Aplicación Frontend (React)
│   ├── src/
│   │   ├── app/                 # Configuración de la app
│   │   │   ├── providers/       # Context Providers
│   │   │   ├── router/          # Configuración de rutas
│   │   │   └── styles/          # Estilos globales
│   │   ├── pages/               # Páginas de la aplicación
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── admin/           # Dashboard admin
│   │   │   └── vecino/          # Dashboard vecino
│   │   ├── widgets/             # Componentes complejos
│   │   │   ├── header/          # Header de navegación
│   │   │   ├── sidebar/         # Menú lateral
│   │   │   └── layout/          # Layout principal
│   │   ├── features/            # Funcionalidades del negocio
│   │   │   ├── auth/            # Autenticación
│   │   │   ├── gestionar-gastos/
│   │   │   ├── realizar-pago/
│   │   │   └── enviar-reporte/
│   │   ├── entities/            # Entidades del dominio
│   │   │   ├── usuario/
│   │   │   ├── departamento/
│   │   │   ├── gasto/
│   │   │   └── pago/
│   │   └── shared/              # Código compartido
│   │       ├── ui/              # Componentes UI reutilizables
│   │       ├── lib/             # Utilidades y helpers
│   │       ├── api/             # Cliente HTTP
│   │       ├── config/          # Configuración y constantes
│   │       └── types/           # Tipos TypeScript compartidos
│   ├── public/                  # Assets estáticos
│   ├── .env.example             # Variables de entorno template
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── condominio-backend/          # API Backend (Python/FastAPI)
    ├── app/
    │   ├── controllers/         # Endpoints REST
    │   │   ├── auth_controller.py
    │   │   ├── usuario_controller.py
    │   │   ├── departamento_controller.py
    │   │   ├── gasto_controller.py
    │   │   └── pago_controller.py
    │   ├── services/            # Lógica de negocio
    │   │   ├── auth_service.py
    │   │   ├── usuario_service.py
    │   │   ├── departamento_service.py
    │   │   ├── gasto_service.py
    │   │   └── pago_service.py
    │   ├── repositories/        # Acceso a datos
    │   │   ├── base_repository.py
    │   │   ├── usuario_repository.py
    │   │   ├── departamento_repository.py
    │   │   ├── gasto_repository.py
    │   │   └── pago_repository.py
    │   ├── models/              # Schemas Pydantic
    │   │   ├── usuario.py
    │   │   ├── departamento.py
    │   │   ├── gasto.py
    │   │   └── pago.py
    │   ├── middleware/          # Middleware custom
    │   │   └── auth_middleware.py
    │   ├── config/              # Configuración
    │   │   ├── settings.py
    │   │   └── firebase.py
    │   ├── utils/               # Utilidades
    │   │   └── permissions.py
    │   └── main.py              # Punto de entrada
    ├── .env.example             # Variables de entorno template
    ├── requirements.txt         # Dependencias Python
    └── firebase-credentials.json (no incluido en git)
```

##  API Endpoints

### Autenticación
```
POST   /api/auth/register       # Registrar nuevo usuario
POST   /api/auth/login          # Iniciar sesión
```

### Usuarios
```
GET    /api/usuarios            # Listar usuarios (admin)
GET    /api/usuarios/{id}       # Obtener usuario específico
PUT    /api/usuarios/{id}       # Actualizar usuario
DELETE /api/usuarios/{id}       # Eliminar usuario (admin)
```

### Departamentos
```
GET    /api/departamentos       # Listar departamentos
GET    /api/departamentos/{id}  # Obtener departamento
POST   /api/departamentos       # Crear departamento (admin)
PUT    /api/departamentos/{id}  # Actualizar departamento (admin)
DELETE /api/departamentos/{id}  # Eliminar departamento (admin)
```

### Gastos
```
GET    /api/gastos-mensuales              # Listar gastos mensuales
GET    /api/gastos-mensuales/{periodo}    # Obtener gasto por periodo
POST   /api/gastos-mensuales              # Crear gasto mensual (admin)
PUT    /api/gastos-mensuales/{periodo}    # Actualizar gasto (admin)
DELETE /api/gastos-mensuales/{periodo}    # Eliminar gasto (admin)

GET    /api/gastos-extraordinarios        # Listar gastos extraordinarios
POST   /api/gastos-extraordinarios        # Crear gasto extraordinario (admin)
```

### Pagos
```
GET    /api/pagos                         # Listar todos los pagos (admin)
GET    /api/pagos/departamento/{id}       # Obtener pagos de un departamento
POST   /api/pagos                         # Crear nuevo pago
PUT    /api/pagos/{id}                    # Actualizar estado de pago (admin)
POST   /api/webhook/flow                  # Webhook de Flow (interno)
```

**Documentación interactiva completa**: http://localhost:8000/docs

## Roadmap

### Fase 1 - MVP ✅ (Completado)
- [x] Autenticación y gestión de usuarios
- [x] CRUD de departamentos
- [x] Gestión de gastos mensuales y extraordinarios
- [x] Sistema de pagos básico
- [x] UI/UX básica responsive

### Fase 2 - Funcionalidades Core 🔄 (En desarrollo)
- [ ] Integración completa con pasarela Flow
- [ ] Dashboard administrativo completo
- [ ] Dashboard de vecino con métricas
- [ ] Sistema de notificaciones (email)
- [ ] Generación de reportes PDF
- [ ] Historial detallado de transacciones

### Fase 3 - Mejoras Avanzadas 📅 (Planeado)
- [ ] Sistema de reclamos y comunicación interna
- [ ] Reserva de espacios comunes
- [ ] Notificaciones push en tiempo real
- [ ] App móvil (React Native)
- [ ] Generación automática de boletas/facturas
- [ ] Dashboard con gráficos y estadísticas avanzadas
- [ ] Exportación de datos a Excel
- [ ] Integración con sistemas contables

### Mejoras Técnicas Futuras
- [ ] Tests unitarios y de integración
- [ ] CI/CD con GitHub Actions
- [ ] Docker y Docker Compose
- [ ] Monitoreo y logging centralizado
- [ ] Caché con Redis
- [ ] Rate limiting
- [ ] Versionado de API

##  Modelo de Datos

### Usuario
```typescript
{
  id: string,              // UID de Firebase
  email: string,
  nombre: string,
  departamentoId: string | null,
  rol: "ADMIN" | "PROPIETARIO" | "ARRENDATARIO",
  esAdmin: boolean,
  fechaRegistro: timestamp
}
```

### Departamento
```typescript
{
  id: string,              // Formato: "DEPTO-101"
  numero: string,          // "101", "201A", etc.
  metrosCuadrados: number,
  propietarios: string[],  // IDs de usuarios
  arrendatarios: string[], // IDs de usuarios
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Gasto Mensual
```typescript
{
  id: string,              // Formato: "2025-01"
  periodo: string,         // "YYYY-MM"
  items: [
    {
      concepto: string,    // "Remuneración personal"
      monto: number        // En CLP
    }
  ],
  total: number,           // Calculado automáticamente
  valorPorM2: number,      // total / metraje_total
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Pago
```typescript
{
  id: string,
  departamentoId: string,
  monto: number,
  periodo: string,         // "2025-01"
  estado: "pendiente" | "pagado" | "verificando" | "rechazado",
  metodo: "flow" | "transferencia_manual",
  flowPaymentId: string | null,
  flowPaymentUrl: string | null,
  fechaPago: timestamp | null,
  verificadoPor: string | null,  // ID del admin
  notas: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```


##  Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

##  Autor

**Fabián Basaes **
- GitHub: [@tu-usuario](https://github.com/Fblink88)

---

⭐️ Si este proyecto te fue útil, considera darle una estrella en GitHub
