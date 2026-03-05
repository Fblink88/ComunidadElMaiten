import { useState, useEffect } from "react"
import { Card, Spinner } from "@/shared/ui"
import { getPagosPendientes, getDepartamentos } from "@/shared/api"
import type { Pago } from "@/shared/types"
import { ExternalLink } from "lucide-react"

interface PagosPorVerificarProps {
    onSeleccionarPago: (pago: Pago) => void
}

export const PagosPorVerificar = ({ onSeleccionarPago }: PagosPorVerificarProps) => {
    const [pagosVerificando, setPagosVerificando] = useState<Pago[]>([])
    const [deptosMap, setDeptosMap] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [pagosData, deptosData] = await Promise.all([
                getPagosPendientes(),
                getDepartamentos()
            ])

            const mapa: Record<string, string> = {}
            deptosData.forEach(d => {
                mapa[d.id] = d.numero
            })

            // Filtrar solo los pagos que están en estado verificando
            const pagosFiltrados = pagosData.filter(p => p.estado === 'verificando')

            setDeptosMap(mapa)
            setPagosVerificando(pagosFiltrados)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar los pagos por verificar")
        } finally {
            setIsLoading(false)
        }
    }

    const formatearMonto = (monto: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
        }).format(monto)
    }

    const formatearFecha = (fecha: string) => {
        if (!fecha) return "Fecha no registrada"
        return new Date(fecha).toLocaleString("es-CL", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
    if (error) return <div className="text-red-500 py-4 text-center">{error}</div>

    return (
        <Card>
            {pagosVerificando.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No hay pagos pendientes de verificación.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-full">
                        <thead>
                            <tr className="border-b text-gray-500 font-medium whitespace-nowrap">
                                <th className="py-3 px-4">Fecha Pago</th>
                                <th className="py-3 px-4">Depto</th>
                                <th className="py-3 px-4">Nombre Pagador</th>
                                <th className="py-3 px-4">Monto</th>
                                <th className="py-3 px-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagosVerificando.map((pago, index) => (
                                <tr key={pago.id || index} className="border-b hover:bg-gray-50 transition-colors whitespace-nowrap">
                                    <td className="py-3 px-4 text-gray-700">
                                        {pago.fecha_transferencia ? formatearFecha(pago.fecha_transferencia) : formatearFecha(pago.created_at)}
                                    </td>
                                    <td className="py-3 px-4 font-semibold text-gray-800">
                                        Dpto {deptosMap[pago.departamento_id] || pago.departamento_id}
                                    </td>
                                    <td className="py-3 px-4 text-gray-700">
                                        {pago.nombre_pagador || 'No especificado'}
                                    </td>
                                    <td className="py-3 px-4 font-bold text-green-700">
                                        {formatearMonto(pago.monto)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => onSeleccionarPago(pago)}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}
