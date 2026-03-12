import { Card, Spinner } from "@/shared/ui"
import type { Pago, Departamento, GastoMensual } from "@/shared/types"

interface ReporteResumenMensualProps {
    pagos: Pago[]
    departamentos: Departamento[]
    gastos: GastoMensual[]
    isLoading: boolean
}

export const ReporteResumenMensual = ({ pagos, gastos, isLoading }: ReporteResumenMensualProps) => {

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spinner /></div>
    }

    if (gastos.length === 0) {
        return <div className="text-center p-8 text-gray-500">No hay registros de gastos mensuales.</div>
    }

    // Calcular datos por mes
    const datosMensuales = gastos.map(gasto => {
        let totalPorCobrar = 0
        let totalRecaudado = 0

        // 1. Total por Cobrar (Suma de las cuotas emitidas - monto bruto - para todos los deptos ese mes)
        // 2. Total Recaudado (Suma pagada real hacia el periodo ese mes)
        pagos.forEach(pago => {
            if (pago.periodo === gasto.periodo && pago.estado !== 'proyectado') {
                totalPorCobrar += pago.monto
                totalRecaudado += (pago.monto_pagado || 0)
            }
        })

        // 3. Total Gastado y Balance Teórico y Real
        const totalGastado = gasto.total || 0
        const balanceTeorico = totalPorCobrar - totalGastado
        const deudaReal = totalPorCobrar - totalRecaudado

        return {
            periodo: gasto.periodo,
            totalPorCobrar,
            totalGastado,
            balanceTeorico,
            totalRecaudado,
            deudaReal
        }
    })

    // Ordenar de más reciente a más antiguo
    datosMensuales.sort((a, b) => b.periodo.localeCompare(a.periodo))

    const obtenerNombreMesAnno = (periodo: string) => {
        const [anio, mesStr] = periodo.split('-')
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        return `${meses[parseInt(mesStr) - 1]} ${anio}`
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Resumen Mensual de Saldos</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Cálculo de ingresos reales vs gastos reales (Mostrando últimos {gastos.length} meses)
                    </p>
                </div>
            </div>

            <Card className="overflow-hidden p-0 border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse w-full">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-bold text-gray-700">Mes y Año</th>
                                <th className="px-4 py-3 text-right font-bold text-gray-700">A Cobrar (Teórico)</th>
                                <th className="px-4 py-3 text-right font-bold text-gray-700 border-l">Gastado (Real)</th>
                                <th className="px-4 py-3 text-right font-bold text-gray-900 border-x shadow-sm">Balance (Teórico)</th>
                                <th className="px-4 py-3 text-right font-bold text-blue-800 bg-blue-50">Real Recaudado</th>
                                <th className="px-4 py-3 text-right font-bold text-red-800 bg-red-50 border-l">Deuda Real</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datosMensuales.map(mes => (
                                <tr key={mes.periodo} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-800 border-r capitalize">{obtenerNombreMesAnno(mes.periodo)}</td>

                                    <td className="px-4 py-3 text-right font-medium text-gray-600">
                                        {formatMoney(mes.totalPorCobrar)}
                                    </td>

                                    <td className="px-4 py-3 text-right font-medium text-red-600 border-l">
                                        {formatMoney(mes.totalGastado)}
                                    </td>

                                    <td className={`px-4 py-3 text-right font-bold border-x shadow-inner ${mes.balanceTeorico >= 0 ? 'text-green-700 bg-green-50/50' : 'text-red-700 bg-red-50/50'}`}>
                                        {mes.balanceTeorico > 0 ? '+ ' : ''}{formatMoney(mes.balanceTeorico)}
                                    </td>

                                    <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/50">
                                        {formatMoney(mes.totalRecaudado)}
                                    </td>

                                    <td className="px-4 py-3 text-right font-bold text-red-700 bg-red-50/50 border-l">
                                        {mes.deudaReal > 0 ? formatMoney(mes.deudaReal) : <span className="text-gray-400 font-normal">Al día</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
