/**
 * Configuración de Firebase
 * 
 * Este archivo contiene la configuración e inicialización de Firebase.
 * Sirve para conectar la aplicación con los servicios de Firebase:
 * - Authentication: Para el login/registro de usuarios
 * - Firestore: Base de datos NoSQL para almacenar datos
 * 
 */

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

/**
 * Credenciales del proyecto Firebase "ComunidadElMaiten"
 * Las credenciales se cargan desde variables de entorno para mayor seguridad.
 * Asegúrate de tener un archivo .env con las credenciales necesarias.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

/**
 * Inicializa la aplicación Firebase con la configuración proporcionada.
 * Esta instancia es el punto de entrada para todos los servicios de Firebase.
 */
const app = initializeApp(firebaseConfig)

/**
 * Instancia de Firebase Authentication.
 * Sirve para manejar el registro, login, logout y estado del usuario.
 */
export const auth = getAuth(app)

/**
 * Instancia de Firestore Database.
 * Sirve para realizar operaciones CRUD (crear, leer, actualizar, eliminar)
 * en las colecciones de la base de datos.
 */
export const db = getFirestore(app)
export default app