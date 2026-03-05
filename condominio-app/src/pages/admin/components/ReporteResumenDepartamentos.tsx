import { useState } from "react"
import { Card, Spinner, Button } from "@/shared/ui"
import type { Pago, Departamento, GastoMensual, Transaccion } from "@/shared/types"

interface ReporteResumenDepartamentosProps {
    pagos: Pago[]
    departamentos: Departamento[]
    gastos: GastoMensual[]
    transacciones: Transaccion[]
    isLoading: boolean
}

export const ReporteResumenDepartamentos = ({ pagos, departamentos, transacciones, isLoading }: Omit<ReporteResumenDepartamentosProps, 'gastos'>) => {

    const [selectedDepto, setSelectedDepto] = useState<any | null>(null)

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Calcular métricas por departamento (toda la historia de la DB)
    const metricas = departamentos.map(depto => {
        const pagosDepto = pagos.filter(p => p.departamento_id === depto.id && p.estado !== 'proyectado')

        // Queremos saber la deuda neta y qué meses exactos debe
        const mesesAdeudadosList: { periodo: string, montoFaltante: number }[] = []
        let totalAdeudado = 0

        // Ordenamos cronológicamente por periodo para la deuda
        pagosDepto.sort((a, b) => a.periodo.localeCompare(b.periodo))

        pagosDepto.forEach(pago => {
            if (pago.estado === 'pendiente' || pago.estado === 'rechazado') {
                const faltante = pago.monto - (pago.monto_pagado || 0)
                if (faltante > 0) {
                    mesesAdeudadosList.push({
                        periodo: pago.periodo,
                        montoFaltante: faltante
                    })
                    totalAdeudado += faltante
                }
            }
        })

        // El verdadero saldo adeudado descuenta el saldo a favor actual, si existe.
        const saldoAFavor = depto.saldo_a_favor || 0
        const deudaNeta = Math.max(0, totalAdeudado - saldoAFavor)

        // Extraer historial de transacciones real (abonos/retiros de la billetera)
        const historialTransacciones = transacciones
            .filter(t => t.departamento_id === depto.id)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

        // Saldo único consolidado (+ si tiene saldo a favor libre, - si tiene deuda neta, 0 si está al día impecable)
        let saldoFinal = 0
        if (saldoAFavor > totalAdeudado) saldoFinal = saldoAFavor - totalAdeudado
        else if (deudaNeta > 0) saldoFinal = -deudaNeta

        return {
            ...depto,
            mesesAdeudadosList,
            saldoFinal,
            deudaNeta,
            historialTransacciones
        }
    })

    const obtenerNombreMesAnno = (periodo: string) => {
        const [anio, mesStr] = periodo.split('-')
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        return `${meses[parseInt(mesStr) - 1]} ${anio}`
    }

    const getMetodoIcon = (metodo: string | null) => {
        if (!metodo) return "Desconocido"
        if (metodo === 'khipu') return "Khipu (Web)"
        if (metodo === 'saldo_a_favor') return "Saldo a Favor"
        if (metodo === 'importacion_historica') return "Transferencia / Histórico"
        return "Transferencia"
    }

    if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Estado Individual por Departamento</h2>
                <div className="text-sm text-gray-500">
                    Historial completo de deudas y saldos
                </div>
            </div>

            <Card className="overflow-hidden p-0 border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-bold text-gray-700">Departamento</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Estado Actual</th>
                                <th className="px-4 py-3 text-right font-bold text-gray-700 border-x">Saldo</th>
                                <th className="px-4 py-3 text-center font-bold text-gray-700">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricas.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                                    <td className="px-4 py-3 border-r">
                                        <div className="font-bold text-gray-800">Depto. {m.numero}</div>
                                        <div className="text-[11px] text-gray-500">{m.propietario}</div>
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        {m.deudaNeta > 0 ? (
                                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200">
                                                Con Deuda
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold border border-green-200">
                                                Al Día
                                            </span>
                                        )}
                                    </td>

                                    <td className={`px-4 py-3 text-right font-bold border-x ${m.saldoFinal > 0 ? 'text-blue-700 bg-blue-50/50' : m.saldoFinal < 0 ? 'text-red-700 bg-red-50/50' : 'text-gray-500'}`}>
                                        {m.saldoFinal > 0 ? `+ ${formatMoney(m.saldoFinal)}` : m.saldoFinal < 0 ? `- ${formatMoney(Math.abs(m.saldoFinal))}` : '$0'}
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setSelectedDepto(m)}
                                            className="text-xs py-1"
                                        >
                                            Ver Detalles
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {/* Totales Generales */}
                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                <td className="px-4 py-3 text-right" colSpan={2}>Totales Comunidad</td>
                                <td className="px-4 py-3 text-right border-x text-gray-700">
                                    {/* Calcular balance global */}
                                    {(() => {
                                        const global = metricas.reduce((acc, current) => acc + current.saldoFinal, 0);
                                        return global > 0 ? `+ ${formatMoney(global)}` : global < 0 ? `- ${formatMoney(Math.abs(global))}` : '$0';
                                    })()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Detalle */}
            {selectedDepto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                            <h3 className="text-lg font-bold text-gray-800">
                                Detalles Depto. {selectedDepto.numero}
                            </h3>
                            <button
                                onClick={() => setSelectedDepto(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-white">
                            {/* Historial de Transacciones (Billetera) */}
                            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                                Últimos Movimientos (Abonos)
                            </h4>
                            <div className="mb-6 bg-gray-50 rounded border border-gray-200 shadow-sm max-h-48 overflow-y-auto">
                                {selectedDepto.historialTransacciones.length > 0 ? (
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-gray-100 text-gray-600 sticky top-0 border-b border-gray-200">
                                            <tr>
                                                <th className="py-2 px-3 font-semibold">Fecha</th>
                                                <th className="py-2 px-3 font-semibold text-right">Monto</th>
                                                <th className="py-2 px-3 font-semibold">Método</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedDepto.historialTransacciones.slice(0, 10).map((t: any) => (
                                                <tr key={t.id} className="hover:bg-white transition-colors">
                                                    <td className="py-2 px-3 whitespace-nowrap text-gray-600">
                                                        {formatDate(t.fecha.split('T')[0])}
                                                    </td>
                                                    <td className={`py-2 px-3 whitespace-nowrap text-right font-medium ${t.monto_total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.monto_total > 0 ? '+' : ''} {formatMoney(t.monto_total)}
                                                    </td>
                                                    <td className="py-2 px-3 text-gray-500 truncate max-w-[120px]" title={t.notas || getMetodoIcon(t.metodo)}>
                                                        {getMetodoIcon(t.metodo)}
                                                        {t.notas && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{t.notas}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm italic">
                                        No hay registros de abonos o transacciones.
                                    </div>
                                )}
                            </div>

                            {/* Deudas */}
                            <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                                Desglose de Deuda
                            </h4>

                            {selectedDepto.mesesAdeudadosList.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedDepto.mesesAdeudadosList.map((deuda: any) => (
                                        <li key={deuda.periodo} className="flex justify-between items-center p-3 bg-red-50 text-red-800 rounded border border-red-100 shadow-sm">
                                            <span className="font-medium capitalize text-sm">{obtenerNombreMesAnno(deuda.periodo)}</span>
                                            <span className="font-bold text-red-700">{formatMoney(deuda.montoFaltante)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 bg-green-50 text-green-700 rounded border border-green-100 text-center font-medium shadow-sm flex flex-col items-center gap-2">
                                    <span className="text-2xl">🎉</span>
                                    Este departamento está impecable.
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex justify-end">
                            <Button onClick={() => setSelectedDepto(null)} variant="secondary">
                                Cerrar Ventana
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
