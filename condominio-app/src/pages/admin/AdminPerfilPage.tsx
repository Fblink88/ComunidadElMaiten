import { useState, useEffect } from "react"
import { Card, Button, Input } from "@/shared/ui"
import { useAuth } from "@/app/providers"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/shared/config/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Mail, KeyRound, UserRound, CheckCircle2 } from "lucide-react"

export const AdminPerfilPage = () => {
    const { usuario, firebaseUser } = useAuth()
    const [nombre, setNombre] = useState("")
    const [isCargando, setIsCargando] = useState(false)
    const [isEnviandoEmail, setIsEnviandoEmail] = useState(false)
    const [mensajeEmail, setMensajeEmail] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)
    const [mensajePerfil, setMensajePerfil] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null)

    useEffect(() => {
        if (usuario?.nombre) {
            setNombre(usuario.nombre)
        }
    }, [usuario?.nombre])

    const handleActualizarPerfil = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!usuario?.id) return

        setIsCargando(true)
        setMensajePerfil(null)

        try {
            const userRef = doc(db, "usuarios", usuario.id)
            await updateDoc(userRef, { nombre: nombre.trim() })
            setMensajePerfil({ tipo: 'exito', texto: 'Perfil actualizado correctamente.' })
        } catch (error) {
            console.error("Error al actualizar perfil:", error)
            setMensajePerfil({ tipo: 'error', texto: 'Error al actualizar el perfil.' })
        } finally {
            setIsCargando(false)
        }
    }

    const handleRestablecerContrasena = async () => {
        if (!firebaseUser?.email) return

        setIsEnviandoEmail(true)
        setMensajeEmail(null)

        try {
            await sendPasswordResetEmail(auth, firebaseUser.email)
            setMensajeEmail({
                tipo: 'exito',
                texto: `Se ha enviado un correo a ${firebaseUser.email} con instrucciones para restablecer tu contraseña.`
            })
        } catch (error) {
            console.error("Error al enviar email de restablecimiento:", error)
            setMensajeEmail({ tipo: 'error', texto: 'Error al enviar el correo. Por favor, intenta de nuevo.' })
        } finally {
            setIsEnviandoEmail(false)
        }
    }

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600 mt-2">
                    Administra tu información personal y la seguridad de tu cuenta.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sección Datos Personales */}
                <Card>
                    <div className="flex items-center gap-2 mb-4 text-blue-900 border-b pb-2">
                        <UserRound className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Datos Personales</h2>
                    </div>

                    <form onSubmit={handleActualizarPerfil} className="space-y-4">
                        {mensajePerfil && (
                            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${mensajePerfil.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {mensajePerfil.tipo === 'exito' && <CheckCircle2 className="w-4 h-4" />}
                                {mensajePerfil.texto}
                            </div>
                        )}

                        <Input
                            label="Nombre Completo"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Administrador Juan Pérez"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    disabled
                                    value={usuario?.email || ""}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 opacity-70 cursor-not-allowed"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">El correo electrónico no se puede modificar.</p>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isCargando}
                            disabled={nombre.trim() === "" || nombre === usuario?.nombre}
                        >
                            Guardar Cambios
                        </Button>
                    </form>
                </Card>

                {/* Sección Seguridad */}
                <Card>
                    <div className="flex items-center gap-2 mb-4 text-purple-900 border-b pb-2">
                        <KeyRound className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Seguridad</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Por motivos de seguridad, la contraseña no se almacena en nuestra base de datos, sino directamente en la plataforma de autenticación de Google (Firebase).
                        </p>
                        <p className="text-sm text-gray-600">
                            Para cambiar tu contraseña, enviaremos un correo electrónico seguro con un enlace para establecer una nueva.
                        </p>

                        {mensajeEmail && (
                            <div className={`p-3 rounded-md flex items-start gap-2 text-sm ${mensajeEmail.tipo === 'exito' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {mensajeEmail.tipo === 'exito' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                                <p>{mensajeEmail.texto}</p>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            onClick={handleRestablecerContrasena}
                            isLoading={isEnviandoEmail}
                            className="mt-4"
                        >
                            Enviar correo para cambiar contraseña
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
