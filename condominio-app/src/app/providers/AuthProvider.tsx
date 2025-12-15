/**
 * Proveedor de Autenticación
 * 
 * Este archivo contiene el componente AuthProvider.
 * Sirve para:
 * - Mantener el estado del usuario actual en toda la app
 * - Escuchar cambios de autenticación de Firebase
 * - Proveer funciones de login, registro y logout
 * - Mostrar un spinner mientras se verifica la sesión inicial
 */

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import type { User } from "firebase/auth"
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/shared/config/firebase"
import type { Usuario } from "@/shared/types"
import { Spinner } from "@/shared/ui"
import { AuthContext } from "./AuthContext"

/**
 * Props del AuthProvider.
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Componente proveedor de autenticación.
 * Envuelve toda la aplicación para proveer el estado de autenticación.
 * 
 * @example
 * // En main.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  /** Usuario de Firebase Auth */
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  
  /** Datos extendidos del usuario desde Firestore */
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  
  /** Estado de carga inicial */
  const [loading, setLoading] = useState(true)

  /**
   * Efecto que escucha cambios en el estado de autenticación.
   * Se ejecuta al montar el componente y cada vez que el usuario
   * inicia o cierra sesión.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (user) {
        // Si hay usuario, buscar sus datos en Firestore
        const userDoc = await getDoc(doc(db, "usuarios", user.uid))
        if (userDoc.exists()) {
          setUsuario({ id: userDoc.id, ...userDoc.data() } as Usuario)
        }
      } else {
        setUsuario(null)
      }

      setLoading(false)
    })

    // Cleanup: cancelar la suscripción al desmontar
    return () => unsubscribe()
  }, [])

  /**
   * Inicia sesión con email y contraseña.
   */
const login = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  
  // TEMPORAL: Obtener token para probar backend
  const token = await result.user.getIdToken()
  console.log('🔑 TOKEN:', token)
}

  /**
   * Registra un nuevo usuario.
   * Crea el usuario en Firebase Auth y luego guarda sus datos en Firestore.
   */
  const register = async (email: string, password: string, nombre: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    
    // Crear documento del usuario en Firestore
    const nuevoUsuario: Omit<Usuario, "id"> = {
      email,
      nombre,
      departamentoId: null,
      rol: "vecino",
      esAdmin: false,
      fechaRegistro: new Date(),
    }

    await setDoc(doc(db, "usuarios", user.uid), nuevoUsuario)
  }

  /**
   * Inicia sesión con Google.
   * Si es la primera vez, crea el documento en Firestore.
   */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(auth, provider)

    // Verificar si ya existe en Firestore
    const userDoc = await getDoc(doc(db, "usuarios", user.uid))
    
    if (!userDoc.exists()) {
      // Primera vez: crear documento
      const nuevoUsuario: Omit<Usuario, "id"> = {
        email: user.email || "",
        nombre: user.displayName || "Usuario",
        departamentoId: null,
        rol: "vecino",
        esAdmin: false,
        fechaRegistro: new Date(),
      }

      await setDoc(doc(db, "usuarios", user.uid), nuevoUsuario)
    }
  }

  /**
   * Cierra la sesión actual.
   */
  const logout = async () => {
    await signOut(auth)
  }

  /**
   * Mientras se verifica la sesión inicial, muestra un spinner.
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        usuario,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}