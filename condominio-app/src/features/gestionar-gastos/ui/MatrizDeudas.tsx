import { useState, useEffect, useMemo } from "react"
import { Card, Spinner } from "@/shared/ui"
import { getAllPagos, getDepartamentos } from "@/shared/api"
import type { Pago, Departamento } from "@/shared/types"

interface MatrizDeudasProps {
    onSeleccionarPago: (pago: Pago) => void
}

export const MatrizDeudas = ({ onSeleccionarPago }: MatrizDeudasProps) => {
    const [pagos, setPagos] = useState<Pago[]>([])
    const [departamentos, setDepartamentos] = useState<Departamento[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // En el futuro, esto podría ser dinámico
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear())

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [pagosData, deptosData] = await Promise.all([
                getAllPagos(),
                getDepartamentos()
            ])

            // Ordenar departamentos numéricamente
            const deptosOrdenados = [...deptosData].sort((a, b) => {
                return a.numero.localeCompare(b.numero, undefined, { numeric: true })
            })

            setDepartamentos(deptosOrdenados)
            setPagos(pagosData)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar la matriz de deudas")
        } finally {
            setIsLoading(false)
        }
    }

    const meses = [
        { num: '01', nombre: 'Enero' },
        { num: '02', nombre: 'Febrero' },
        { num: '03', nombre: 'Marzo' },
        { num: '04', nombre: 'Abril' },
        { num: '05', nombre: 'Mayo' },
        { num: '06', nombre: 'Junio' },
        { num: '07', nombre: 'Julio' },
        { num: '08', nombre: 'Agosto' },
        { num: '09', nombre: 'Septiembre' },
        { num: '10', nombre: 'Octubre' },
        { num: '11', nombre: 'Noviembre' },
        { num: '12', nombre: 'Diciembre' },
    ]

    const formatearMonto = (monto: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(monto)
    }

    const obtenerPagoCelda = (deptoId: string, mesStr: string) => {
        const periodoBuscado = `${anioSeleccionado}-${mesStr}`
        return pagos.find(p => p.departamento_id === deptoId && p.periodo === periodoBuscado)
    }

    const deudasCalculadas = useMemo(() => {
        const celdas: Record<string, number> = {}
        const totales: Record<string, number> = {}
        const totalesGlobales: Record<string, number> = {}

        for (const depto of departamentos) {
            let saldoRestante = depto.saldo_a_favor || 0

            // Ordenamos los pagos pendientes y proyectados del depto más antiguo al más nuevo para descontar en cascada
            const pendientes = pagos
                .filter(p => p.departamento_id === depto.id && (p.estado === 'pendiente' || p.estado === 'rechazado' || p.estado === 'proyectado'))
                .sort((a, b) => a.periodo.localeCompare(b.periodo))

            for (const p of pendientes) {
                let deudaBruta = p.monto - (p.monto_pagado || 0)

                if (saldoRestante >= deudaBruta) {
                    saldoRestante -= deudaBruta
                    celdas[p.id] = 0
                } else if (saldoRestante > 0) {
                    celdas[p.id] = deudaBruta - saldoRestante
                    saldoRestante = 0
                } else {
                    celdas[p.id] = deudaBruta
                }
            }

            // El `totalDeudaEfectiva` incluye solo los periodos iterados. 
            // Si queremos el pendiente anual específico, podríamos filtrar `pendientes` por `anioSeleccionado`.
            // Para mantener compatibilidad con la vista anual estricta:
            // Para mantener compatibilidad con la vista anual estricta, solo sumamos lo que ES deuda real:
            const pendientesAnuales = pendientes.filter(p => p.periodo.startsWith(anioSeleccionado.toString()) && p.estado !== 'proyectado')
            let totalAnual = 0
            for (const p of pendientesAnuales) {
                totalAnual += celdas[p.id] || 0
            }
            totales[depto.id] = totalAnual

            // Sumar TODO el pendiente real de la historia
            const pendientesReales = pendientes.filter(p => p.estado !== 'proyectado')
            let totalGlobal = 0
            for (const p of pendientesReales) {
                totalGlobal += celdas[p.id] || 0
            }
            totalesGlobales[depto.id] = totalGlobal
        }

        return { celdas, totales, totalesGlobales }
    }, [pagos, departamentos, anioSeleccionado])

    const obtenerColorCelda = (pago?: Pago) => {
        if (!pago) return "" // No hay deuda generada en ese mes
        switch (pago.estado) {
            case "pagado":
                if (pago.metodo === 'saldo_a_favor') {
                    return "bg-blue-50 text-blue-700"
                }
                return "bg-green-50 text-green-700"
            case "verificando": return "bg-yellow-50 text-yellow-700"
            case "rechazado": return "bg-red-100 text-red-800"
            case "pendiente":
                // Si la deuda es de este mes o de un período futuro, y aún no ha terminado, no la pintamos con fondo rojo de 'moroso'
                // Solo pintamos rojo intenso si ya está derechamente atrasado (meses anteriores)
                const [pagoAnio, pagoMes] = pago.periodo.split('-').map(Number)
                const hoy = new Date()
                // Asumimos que si estamos en el mismo mes y año de la deuda, no es "morosa" aún sino "al día a facturar"
                // A menos que sea más vieja que el mes actual.
                const esDeudaRecienteOFutura = (pagoAnio === hoy.getFullYear() && pagoMes >= hoy.getMonth() + 1) || (pagoAnio > hoy.getFullYear())

                if (esDeudaRecienteOFutura) {
                    return "bg-white text-red-600 font-medium border border-red-100" // Blanco con texto rojo para distinguirlo pero no gritar "MOROSO"
                } else {
                    return "bg-red-50 text-red-700" // Atrasado
                }
            case "proyectado":
                // Si la celda bajó a cero por saldo a favor, lo mostramos verde pastel suave
                if (pago && deudasCalculadas.celdas[pago.id] === 0) {
                    return "bg-green-50/50 text-green-600/70 italic font-medium"
                }
                return "bg-gray-50 text-gray-400 italic font-medium"
            default: return "bg-gray-50"
        }
    }

    if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
    if (error) return <div className="text-red-500 py-4 text-center">{error}</div>

    return (
        <div className="space-y-4">
            {/* Selector de Año */}
            <Card>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Resumen anual de deudas {anioSeleccionado}
                    </h2>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setAnioSeleccionado(prev => prev - 1)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                        >
                            Anterior
                        </button>
                        <span className="font-medium px-2">{anioSeleccionado}</span>
                        <button
                            onClick={() => setAnioSeleccionado(prev => prev + 1)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </Card>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200"></div> Pagado Directo</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-200"></div> Pagado con Saldo (Billetera)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border border-yellow-200"></div> Verificando (Transferencia)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200"></div> Pendiente o Rechazado</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 border border-gray-200"></div> Cobro Proyectado</div>
            </div>

            {/* Matriz Excel-like */}
            <Card className="overflow-x-auto p-0 border border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse min-w-max">
                    <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-300">
                            <th className="py-2 px-3 text-left font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 w-32">Depto / Propietario</th>
                            {meses.map(mes => (
                                <th key={mes.num} className="py-2 px-2 text-center font-semibold text-gray-700 border-r border-gray-200 min-w-[90px]">
                                    {mes.nombre}
                                </th>
                            ))}
                            <th className="py-2 px-3 text-center font-bold text-red-900 bg-red-50 border-l border-gray-300">Pendiente Anual</th>
                            <th className="py-2 px-3 text-center font-bold text-red-900 bg-red-100 border-l border-gray-300 shadow-sm w-32">Pendiente Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departamentos.map(depto => (
                            <tr key={depto.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td className="py-2 px-3 border-r border-gray-200 sticky left-0 bg-white z-10 font-medium text-gray-800">
                                    <div className="flex flex-col">
                                        <span>Depto. {depto.numero}</span>
                                        <span className="text-xs text-gray-500 font-normal truncate max-w-[120px]" title={depto.propietario}>{depto.propietario}</span>
                                    </div>
                                </td>

                                {meses.map(mes => {
                                    const pago = obtenerPagoCelda(depto.id, mes.num)
                                    return (
                                        <td
                                            key={`${depto.id}-${mes.num}`}
                                            className={`py-2 px-2 text-center border-r border-gray-200 transition-colors cursor-pointer hover:bg-gray-100 ${obtenerColorCelda(pago)} ${pago && (pago.estado === 'pendiente' || pago.estado === 'rechazado') ? 'font-semibold' : ''}`}
                                            onClick={() => pago && onSeleccionarPago(pago)}
                                            title={pago ? `Periodo: ${pago.periodo} | Original: ${formatearMonto(pago.monto)} | Pagado: ${formatearMonto(pago.monto_pagado || 0)}` : "Sin deuda generada"}
                                        >
                                            {pago ? (
                                                (pago.estado === 'pendiente' || pago.estado === 'rechazado' || pago.estado === 'proyectado')
                                                    ? formatearMonto(deudasCalculadas.celdas[pago.id] ?? (pago.monto - (pago.monto_pagado || 0)))
                                                    : formatearMonto(pago.monto)
                                            ) : ""}
                                        </td>
                                    )
                                })}

                                {/* Columna Pendiente Anual */}
                                <td className="py-2 px-3 text-center border-l bg-red-50/50 border-gray-300">
                                    {(deudasCalculadas.totales[depto.id] || 0) > 0 ? (
                                        <span className="font-bold text-red-700 px-2 py-1 bg-red-100 rounded">
                                            {formatearMonto(deudasCalculadas.totales[depto.id])}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-bold">Al día</span>
                                    )}
                                </td>

                                {/* Columna Pendiente Total */}
                                <td className="py-2 px-3 text-center border-l bg-red-100/50 border-gray-300">
                                    {(deudasCalculadas.totalesGlobales[depto.id] || 0) > 0 ? (
                                        <span className="font-bold text-red-800 text-base">
                                            {formatearMonto(deudasCalculadas.totalesGlobales[depto.id])}
                                        </span>
                                    ) : (
                                        <span className="text-green-600 font-bold">0</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <p className="text-sm text-gray-500 italic mt-2">
                * Haz click sobre cualquier monto para ver el detalle del pago o aprobar una transferencia.
            </p>
        </div>
    )
}
