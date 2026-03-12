import { useEffect, useState } from "react"
import { useAuth } from "@/app/providers"
import { Button, Card } from "@/shared/ui"
import { getDepartamentos } from "@/shared/api"
import type { Departamento } from "@/shared/types"
import { Clock, LogOut } from "lucide-react"

export const PendingApprovalPage = () => {
    const { logout, usuario } = useAuth()
    const [depto, setDepto] = useState<Departamento | null>(null)

    useEffect(() => {
        if (usuario?.departamento_solicitado_id) {
            getDepartamentos()
                .then((deptos) => {
                    const found = deptos.find((d) => d.id === usuario.departamento_solicitado_id)
                    setDepto(found || null)
                })
                .catch(() => { })
        }
    }, [usuario?.departamento_solicitado_id])

    const rolLabel: Record<string, string> = {
        propietario: "propietario",
        arrendatario: "arrendatario",
        vecino: "vecino",
    }

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

                        <p className="text-sm text-gray-500 mb-4 px-4">
                            Hola <strong>{usuario?.nombre}</strong>. Tu solicitud fue recibida.
                        </p>

                        {depto && (
                            <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Departamento solicitado:</span> Depto {depto.numero}
                                </p>
                                {depto.propietario && (
                                    <p className="text-sm text-blue-700">
                                        <span className="font-medium">Propietario:</span> {depto.propietario}
                                    </p>
                                )}
                                {usuario?.rol && (
                                    <p className="text-sm text-blue-700">
                                        <span className="font-medium">Rol solicitado:</span> {rolLabel[usuario.rol] || usuario.rol}
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-gray-400 mb-2 px-4">
                            El administrador o el propietario del departamento debe aprobar tu acceso.
                        </p>

                        <div className="border-t border-gray-200 pt-4 mt-4">
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
