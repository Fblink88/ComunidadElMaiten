import { useState, useEffect } from "react"
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, arrayUnion } from "firebase/firestore"
import { db } from "@/shared/config/firebase"
import { Button } from "@/shared/ui"
import { type Usuario } from "@/shared/types"
import { getDepartamentos } from "@/shared/api/departamentos.api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, ShieldOff, Trash2, Search, Clock, X, UserCheck } from "lucide-react"

const formatFecha = (fecha: any) => {
    if (!fecha) return "-"
    try {
        if (fecha.toDate) return format(fecha.toDate(), "dd MMM yyyy", { locale: es })
        return format(new Date(fecha), "dd MMM yyyy", { locale: es })
    } catch (e) {
        return "-"
    }
}

export const AdminUsuariosPage = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [pendientes, setPendientes] = useState<Usuario[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"todos" | "activos" | "bloqueados" | "propietarios" | "arrendatarios">("activos")
    const [searchTerm, setSearchTerm] = useState("")
    const [deptoMap, setDeptoMap] = useState<Record<string, string>>({})

    const fetchUsuariosAndDeptos = async () => {
        setLoading(true)
        try {
            // Cargar usuarios activos/normales (excluir pendientes de aprobacion de registro)
            const q = query(collection(db, "usuarios"), orderBy("fecha_registro", "desc"))
            const querySnapshot = await getDocs(q)
            const todos = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Usuario[]

            // Poner todos los usuarios en el arreglo principal para que los filtros funcionen
            setUsuarios(todos)

            // También mantenemos la lista separada para la cajita amarilla de notificaciones
            setPendientes(todos.filter(u => u.estado_cuenta === "pendiente_aprobacion"))

            // Cargar departamentos para mapear IDs a Números
            const deptos = await getDepartamentos()
            const map: Record<string, string> = {}
            deptos.forEach(d => {
                map[d.id] = d.numero
            })
            setDeptoMap(map)

        } catch (error) {
            console.error("Error al cargar datos:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsuariosAndDeptos()
    }, [])

    const handleAprobar = async (id: string) => {
        if (!confirm("¿Aprobar a este usuario para que pueda acceder al sistema?")) return
        try {
            await updateDoc(doc(db, "usuarios", id), { activo: true })
            setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: true } : u))
        } catch (error) {
            console.error("Error al aprobar usuario:", error)
        }
    }

    /**
     * Aprobar registro pendiente: asigna el depto solicitado y activa la cuenta.
     */
    const handleAprobarRegistro = async (usuario: Usuario) => {
        if (!usuario.departamento_solicitado_numero) {
            alert("Este usuario no tiene un departamento solicitado."); return
        }

        // Find the actual department ID based on the requested number
        const deptoId = Object.keys(deptoMap).find(key => deptoMap[key] === usuario.departamento_solicitado_numero);

        if (!deptoId) {
            alert(`No se encontró el departamento con número ${usuario.departamento_solicitado_numero} en el sistema.`); return
        }

        if (!confirm(`¿Aprobar a ${usuario.nombre} como ${usuario.rol} del depto ${usuario.departamento_solicitado_numero}?`)) return
        try {
            // 1. Actualizar usuario en Firestore
            await updateDoc(doc(db, "usuarios", usuario.id), {
                departamento_id: deptoId,
                departamentoId: deptoId,
                estado_cuenta: "activo",
                activo: true,
                departamento_solicitado_numero: null,
            })
            // 2. Agregar uid al array del departamento
            await updateDoc(doc(db, "departamentos", deptoId), {
                usuarios_ids: arrayUnion(usuario.id)
            })
            // 3. Actualizar estado local
            setPendientes(prev => prev.filter(u => u.id !== usuario.id))
            await fetchUsuariosAndDeptos()
        } catch (error) {
            console.error("Error al aprobar registro:", error)
            alert("Error al aprobar. Revisa la consola.")
        }
    }

    /**
     * Rechazar registro pendiente: elimina el usuario de Firestore.
     */
    const handleRechazarRegistro = async (usuario: Usuario) => {
        if (!confirm(`¿Rechazar y eliminar la solicitud de ${usuario.nombre}? Esta acción no se puede deshacer.`)) return
        try {
            await deleteDoc(doc(db, "usuarios", usuario.id))
            setPendientes(prev => prev.filter(u => u.id !== usuario.id))
        } catch (error) {
            console.error("Error al rechazar registro:", error)
        }
    }

    const handleBloquear = async (id: string) => {
        if (!confirm("¿Bloquear acceso a este usuario?")) return
        try {
            await updateDoc(doc(db, "usuarios", id), { activo: false })
            setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: false } : u))
        } catch (error) {
            console.error("Error al bloquear usuario:", error)
        }
    }

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar permanentemente a este usuario?")) return
        try {
            await deleteDoc(doc(db, "usuarios", id))
            setUsuarios(prev => prev.filter(u => u.id !== id))
        } catch (error) {
            console.error("Error al eliminar usuario:", error)
        }
    }

    const filteredUsuarios = usuarios.filter(u => {
        // Un usuario es "activo" si su estado de cuenta es explícitamente "activo", o si no es "pendiente_aprobacion" y no está bloqueado.
        const isPendiente = u.estado_cuenta === 'pendiente_aprobacion'
        const isBloqueado = u.activo === false
        const isActivo = !isPendiente && !isBloqueado

        const matchesFilter =
            filter === "todos" ? true :
                filter === "activos" ? isActivo :
                    filter === "bloqueados" ? isBloqueado :
                        filter === "propietarios" ? u.rol === 'propietario' :
                            filter === "arrendatarios" ? (u.rol === 'arrendatario' || u.rol === 'vecino') : true

        const matchesSearch =
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.departamento_id || "").toLowerCase().includes(searchTerm.toLowerCase())

        return matchesFilter && matchesSearch
    }).sort((a, b) => {
        const numA = a.departamento_id ? (deptoMap[a.departamento_id] || "zz") : "zz"
        const numB = b.departamento_id ? (deptoMap[b.departamento_id] || "zz") : "zz"

        if (numA === numB) {
            return a.nombre.localeCompare(b.nombre)
        }

        return numA.localeCompare(numB, undefined, { numeric: true })
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">
                Gestión de Usuarios
            </h1>

            {/* =============================== */}
            {/* SECCIÓN: Solicitudes de Registro */}
            {/* =============================== */}
            {pendientes.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <h2 className="text-lg font-semibold text-yellow-800">
                            Solicitudes de Registro Pendientes ({pendientes.length})
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {pendientes.map(u => (
                            <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white rounded-lg border border-yellow-200 p-4">
                                <div>
                                    <div className="font-medium text-gray-900">{u.nombre}</div>
                                    <div className="text-sm text-gray-500">{u.email}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Rol solicitado:</span>{" "}
                                        <span className="capitalize">{u.rol}</span>
                                        {" · "}
                                        <span className="font-medium">Depto:</span>{" "}
                                        {u.departamento_solicitado_numero
                                            ? `Depto ${u.departamento_solicitado_numero}`
                                            : "No especificado"}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Registrado: {formatFecha(u.fecha_registro || u.fechaRegistro)}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleAprobarRegistro(u)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleRechazarRegistro(u)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                {/* Filtros y Búsqueda */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                    <div className="flex gap-2">
                        <Button
                            variant={filter === "todos" ? "primary" : "secondary"}
                            onClick={() => setFilter("todos")}
                            size="sm"
                        >
                            Todos
                        </Button>
                        <Button
                            variant={filter === "activos" ? "primary" : "secondary"}
                            onClick={() => setFilter("activos")}
                            size="sm"
                            className={filter === "activos" ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : ""}
                        >
                            Activos
                        </Button>
                        <Button
                            variant={filter === "bloqueados" ? "primary" : "secondary"}
                            onClick={() => setFilter("bloqueados")}
                            size="sm"
                            className={filter === "bloqueados" ? "bg-red-500 hover:bg-red-600 border-red-500 text-white" : ""}
                        >
                            Bloqueados
                        </Button>
                        <Button
                            variant={filter === "propietarios" ? "primary" : "secondary"}
                            onClick={() => setFilter("propietarios")}
                            size="sm"
                            className={filter === "propietarios" ? "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white" : ""}
                        >
                            Propietarios
                        </Button>
                        <Button
                            variant={filter === "arrendatarios" ? "primary" : "secondary"}
                            onClick={() => setFilter("arrendatarios")}
                            size="sm"
                            className={filter === "arrendatarios" ? "bg-purple-500 hover:bg-purple-600 border-purple-500 text-white" : ""}
                        >
                            Residentes
                        </Button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email..."
                            className="pl-8 w-full rounded-md border border-gray-300 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol / Depto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsuarios.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                                                    <div className="text-sm text-gray-500">{usuario.email}</div>
                                                    {usuario.es_admin && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 capitalize">{usuario.rol}</div>
                                            <div className="text-sm text-gray-500">
                                                {usuario.departamento_id
                                                    ? `Depto ${deptoMap[usuario.departamento_id] || usuario.departamento_id}`
                                                    : "Sin Depto"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {((u: any) => u.activo || u.estado_cuenta === 'activo')(usuario) ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatFecha(usuario.fecha_registro)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {!((u: any) => u.activo || u.estado_cuenta === 'activo')(usuario) && (
                                                    <button
                                                        onClick={() => handleAprobar(usuario.id)}
                                                        className="group relative text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                                                    >
                                                        <Check className="h-5 w-5" />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            Aprobar acceso
                                                        </span>
                                                    </button>
                                                )}
                                                {((u: any) => u.activo || u.estado_cuenta === 'activo')(usuario) && (
                                                    <button
                                                        onClick={() => handleBloquear(usuario.id)}
                                                        className="group relative text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50"
                                                    >
                                                        <ShieldOff className="h-5 w-5" />
                                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            Bloquear acceso
                                                        </span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEliminar(usuario.id)}
                                                    className="group relative text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                    <span className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                        Eliminar usuario
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
