import { useState, useEffect } from "react"
import { Card, Spinner } from "@/shared/ui"
import { getAllTransacciones, getDepartamentos, getGlobalHistorialBilletera } from "@/shared/api"

type MovimientoUnificado = {
    id: string;
    departamento_id: string;
    fecha: string;
    monto: number;
    metodo: string;
    notas: string;
    tipo: 'abono' | 'ajuste';
}

export const ListaTransacciones = () => {
    const [transacciones, setTransacciones] = useState<MovimientoUnificado[]>([])
    const [filteredTransacciones, setFilteredTransacciones] = useState<MovimientoUnificado[]>([])
    const [deptosMap, setDeptosMap] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [filtroDepto, setFiltroDepto] = useState("")

    useEffect(() => {
        cargarDatos()
    }, [])

    useEffect(() => {
        if (!filtroDepto) {
            setFilteredTransacciones(transacciones)
        } else {
            const busqueda = filtroDepto.toLowerCase().trim()
            const filt = transacciones.filter(t => {
                const numDepto = deptosMap[t.departamento_id] || ""
                return numDepto.toLowerCase().includes(busqueda)
            })
            setFilteredTransacciones(filt)
        }
    }, [transacciones, filtroDepto, deptosMap])

    const cargarDatos = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [transData, deptosData, billData] = await Promise.all([
                getAllTransacciones(),
                getDepartamentos(),
                getGlobalHistorialBilletera()
            ])

            const mapa: Record<string, string> = {}
            deptosData.forEach(d => {
                mapa[d.id] = d.numero
            })

            // Transacciones normales
            const fromTrans: MovimientoUnificado[] = transData.map(t => ({
                id: t.id,
                departamento_id: t.departamento_id,
                fecha: t.fecha,
                monto: t.monto_total,
                metodo: t.metodo,
                notas: t.notas || '-',
                tipo: (t.monto_total < 0 ? 'ajuste' : 'abono') as 'ajuste' | 'abono'
            }))

            // Movimientos de billetera (ajustes manuales)
            const fromBill: MovimientoUnificado[] = billData.map(b => ({
                id: b.id,
                departamento_id: b.departamento_id,
                fecha: b.fecha,
                monto: b.monto_cambio,
                metodo: 'ajuste_manual',
                notas: b.motivo || 'Ajuste manual',
                tipo: (b.monto_cambio < 0 ? 'ajuste' : 'abono') as 'ajuste' | 'abono'
            }))

            // Unificar con deduplicación (dual-write: mismo monto+notas en +-2s = duplicado)
            const todos = [...fromTrans]
            for (const bm of fromBill) {
                const isDuplicate = fromTrans.some(t =>
                    t.departamento_id === bm.departamento_id &&
                    t.monto === bm.monto &&
                    t.notas === bm.notas &&
                    Math.abs(new Date(t.fecha).getTime() - new Date(bm.fecha).getTime()) < 2000
                )
                if (!isDuplicate) todos.push(bm)
            }
            todos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

            setDeptosMap(mapa)
            setTransacciones(todos)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar el historial de abonos")
        } finally {
            setIsLoading(false)
        }
    }

    const getMetodoIcon = (metodo: string | null) => {
        if (!metodo) return "Desconocido"
        if (metodo === 'khipu') return "Khipu (Web)"
        if (metodo === 'saldo_a_favor') return "Saldo a Favor"
        if (metodo === 'importacion_historica') return "Transferencia / Histórico"
        return "Transferencia"
    }

    const formatearMonto = (monto: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(monto)
    }

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString("es-CL", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
    if (error) return <div className="text-red-500 py-4 text-center">{error}</div>

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <Card>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar por Departamento
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: 11"
                        className="w-full sm:w-1/3 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filtroDepto}
                        onChange={(e) => setFiltroDepto(e.target.value)}
                    />
                </div>
            </Card>

            {/* Table */}
            <Card>
                {filteredTransacciones.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No hay transacciones registradas.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-gray-500 font-medium">
                                    <th className="py-3 px-4">Fecha</th>
                                    <th className="py-3 px-4">Depto</th>
                                    <th className="py-3 px-4">Monto</th>
                                    <th className="py-3 px-4">Método</th>
                                    <th className="py-3 px-4 hidden md:table-cell">Notas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransacciones.map((mov, index) => (
                                    <tr key={mov.id || index} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-700">
                                            {formatearFecha(mov.fecha || new Date().toISOString())}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-800">
                                            Dpto {deptosMap[mov.departamento_id] || mov.departamento_id}
                                        </td>
                                        <td className="py-3 px-4 font-bold">
                                            <span className={mov.monto >= 0 ? "text-green-600" : "text-red-600"}>
                                                {mov.monto > 0 ? '+ ' : ''}{formatearMonto(Math.abs(mov.monto))}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {getMetodoIcon(mov.metodo)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 hidden md:table-cell text-sm text-gray-500">
                                            {mov.notas || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}
