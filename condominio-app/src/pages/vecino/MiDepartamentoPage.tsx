import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/shared/config/firebase"
import { useAuth } from "@/app/providers"
import { Card } from "@/shared/ui"
import { type Usuario } from "@/shared/types"
import { Check, Trash2, User as UserIcon } from "lucide-react"

export const MiDepartamentoPage = () => {
    const { usuario } = useAuth()
    const [residentes, setResidentes] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)

    const fetchResidentes = async () => {
        if (!usuario?.departamento_id) return

        setLoading(true)
        try {
            const q = query(
                collection(db, "usuarios"),
                where("departamento_id", "==", usuario.departamento_id)
            )
            const querySnapshot = await getDocs(q)
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Usuario[]

            setResidentes(data)
        } catch (error) {
            console.error("Error al cargar residentes:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchResidentes()
    }, [usuario?.departamento_id])

    const handleAprobar = async (id: string) => {
        try {
            await updateDoc(doc(db, "usuarios", id), { activo: true })
            setResidentes(prev => prev.map(u => u.id === id ? { ...u, activo: true } : u))
        } catch (error) {
            console.error("Error al aprobar:", error)
        }
    }

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Desvincular a este usuario del departamento?")) return
        try {
            await deleteDoc(doc(db, "usuarios", id))
            setResidentes(prev => prev.filter(u => u.id !== id))
        } catch (error) {
            console.error("Error al eliminar:", error)
        }
    }

    if (!usuario?.departamento_id) {
        return (
            <Card title="Mi Departamento">
                <p className="text-gray-500">No tienes un departamento asignado.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">
                Gestión de Departamento {usuario.departamento_id}
            </h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {residentes.map((residente) => (
                    <Card key={residente.id} className="relative overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <UserIcon className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{residente.nombre}</h3>
                                    <p className="text-sm text-gray-500">{residente.email}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${residente.rol === "propietario" ? "bg-purple-100 text-purple-800" :
                                        residente.rol === "arrendatario" ? "bg-blue-100 text-blue-800" :
                                            "bg-gray-100 text-gray-800"
                                        }`}>
                                        {residente.rol}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                {residente.activo ? (
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                        Activo
                                    </span>
                                ) : (
                                    <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                        Pendiente
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!residente.activo && (
                                    <button
                                        onClick={() => handleAprobar(residente.id)}
                                        className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                                        title="Aprobar acceso"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}

                                {/* Solo permitir eliminar si no es uno mismo y si no es otro propietario (opcional) */}
                                {residente.id !== usuario.id && (
                                    <button
                                        onClick={() => handleEliminar(residente.id)}
                                        className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                                        title="Desvincular usuario"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {residentes.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-8">No hay otros residentes registrados en este departamento.</p>
            )}
        </div>
    )
}
