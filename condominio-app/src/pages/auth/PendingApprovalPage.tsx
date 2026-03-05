import { useAuth } from "@/app/providers"
import { Button, Card } from "@/shared/ui"
import { Clock, LogOut } from "lucide-react"

export const PendingApprovalPage = () => {
    const { logout, usuario } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-6">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Comunidad El Maitén
                    </h2>
                </div>

                <Card>
                    <div className="text-center py-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Cuenta Pendiente de Aprobación
                        </h3>

                        <p className="text-sm text-gray-500 mb-6 px-4">
                            Hola <strong>{usuario?.nombre}</strong>. Tu cuenta ha sido creada exitosamente,
                            pero requiere ser aprobada por la administración o el propietario de tu departamento
                            antes de poder acceder al sistema.
                        </p>

                        <div className="border-t border-gray-200 pt-6">
                            <p className="text-xs text-gray-400 mb-4">
                                Recibirás una notificación cuando tu acceso sea habilitado.
                            </p>

                            <Button variant="secondary" onClick={logout} fullWidth>
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
