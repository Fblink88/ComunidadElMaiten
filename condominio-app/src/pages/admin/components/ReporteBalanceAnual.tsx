import { Card, Spinner } from "@/shared/ui"
import type { Pago, Departamento, GastoMensual } from "@/shared/types"
import { useMemo } from "react"

interface ReporteBalanceAnualProps {
    pagos: Pago[]
    departamentos: Departamento[] // Aunque no lo usemos directamente para el calculo global, es parte del contexto
    gastos: GastoMensual[]
    isLoading: boolean
}

export const ReporteBalanceAnual = ({ pagos, gastos, isLoading }: ReporteBalanceAnualProps) => {

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }).format(amount)
    }

    // Calcular métricas agrupadas por año
    const datosAnuales = useMemo(() => {
        const porAno: Record<string, { totalGastado: number, totalRecaudado: number }> = {}

        // 1. Sumar gastos por año (solo desde 2025)
        gastos.forEach(g => {
            const y = g.periodo.split("-")[0]
            if (Number(y) >= 2025) {
                if (!porAno[y]) porAno[y] = { totalGastado: 0, totalRecaudado: 0 }
                porAno[y].totalGastado += g.total
            }
        })

        // 2. Sumar recaudación por año (solo desde 2025)
        pagos.forEach(p => {
            if (p.estado === 'pagado') {
                const y = p.periodo.split("-")[0]
                if (Number(y) >= 2025) {
                    if (!porAno[y]) porAno[y] = { totalGastado: 0, totalRecaudado: 0 }
                    porAno[y].totalRecaudado += p.monto
                }
            }
        })

        // 3. Convertir a array y ordenar CRONOLÓGICAMENTE (Ascendente) para calcular acumulados
        const ordenadosAsc = Object.entries(porAno)
            .map(([anio, data]) => ({
                anio,
                ...data,
                totalAdeudado: data.totalGastado > data.totalRecaudado ? data.totalGastado - data.totalRecaudado : 0,
                saldoPeriodo: data.totalRecaudado - data.totalGastado
            }))
            .sort((a, b) => Number(a.anio) - Number(b.anio))

        // Inyectar el saldo histórico artificial
        const saldoInicial = 870306
        const datosConInicial = [
            {
                anio: "Pre-2025",
                totalGastado: 0,
                totalRecaudado: saldoInicial,
                totalAdeudado: 0,
                saldoPeriodo: saldoInicial,
            },
            ...ordenadosAsc
        ]

        // 4. Calcular Saldo Acumulado
        let acumulado = 0
        const datosConAcumulado = datosConInicial.map(d => {
            acumulado += d.saldoPeriodo
            return { ...d, saldoAcumulado: acumulado }
        })

        // 5. Ordenar Descendente (Más reciente primero) para visualización
        // Ponemos el "Pre-2025" siempre al final de la lista descendente
        return datosConAcumulado.sort((a, b) => {
            if (a.anio === "Pre-2025") return 1
            if (b.anio === "Pre-2025") return -1
            return Number(b.anio) - Number(a.anio)
        })

    }, [gastos, pagos])

    if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>

    if (datosAnuales.length === 0) {
        return <div className="text-center p-8 text-gray-500">No hay datos financieros registrados.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Balance Financiero Anual</h2>
                <div className="text-sm text-gray-500">
                    Histórico del condominio (con Flujo de Caja)
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-200">
                                <th className="p-3 text-left font-bold text-gray-700">Año</th>
                                <th className="p-3 text-right font-bold text-gray-700">Gastado</th>
                                <th className="p-3 text-right font-bold text-gray-700">Recaudado</th>
                                <th className="p-3 text-right font-bold text-gray-700">Saldo Periodo</th>
                                <th className="p-3 text-right font-bold text-gray-700">Saldo Acumulado</th>
                                <th className="p-3 text-center font-bold text-gray-700">% Rec.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datosAnuales.map(d => {
                                const porcentaje = d.totalGastado > 0
                                    ? Math.round((d.totalRecaudado / d.totalGastado) * 100)
                                    : 0

                                // Color para saldo periodo
                                const colorSaldo = d.saldoPeriodo >= 0 ? 'text-green-700' : 'text-red-600'
                                // Color para saldo acumulado (Caja)
                                const colorAcumulado = d.saldoAcumulado >= 0 ? 'text-blue-700 font-bold' : 'text-red-700 font-bold'

                                return (
                                    <tr key={d.anio} className="hover:bg-gray-50 border-b">
                                        <td className="p-3 font-bold text-gray-800">{d.anio}</td>
                                        <td className="p-3 text-right text-gray-600">
                                            {formatMoney(d.totalGastado)}
                                        </td>
                                        <td className="p-3 text-right font-medium text-green-700">
                                            {formatMoney(d.totalRecaudado)}
                                        </td>
                                        <td className={`p-3 text-right font-medium ${colorSaldo}`}>
                                            {formatMoney(d.saldoPeriodo)}
                                        </td>
                                        <td className={`p-3 text-right ${colorAcumulado} bg-gray-50`}>
                                            {formatMoney(d.saldoAcumulado)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${porcentaje >= 95 ? 'bg-green-100 text-green-800' :
                                                porcentaje >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {d.anio === "Pre-2025" ? "N/A" : `${porcentaje}%`}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}

                            {/* Totales Históricos */}
                            <tr className="bg-gray-900 text-white font-bold">
                                <td className="p-3">TOTAL</td>
                                <td className="p-3 text-right">
                                    {formatMoney(datosAnuales.reduce((acc, d) => acc + d.totalGastado, 0))}
                                </td>
                                <td className="p-3 text-right text-green-300">
                                    {formatMoney(datosAnuales.reduce((acc, d) => acc + d.totalRecaudado, 0))}
                                </td>
                                <td className="p-3 text-right">
                                    {/* Saldo total histórico simple */}
                                    {formatMoney(datosAnuales.reduce((acc, d) => acc + d.saldoPeriodo, 0))}
                                </td>
                                <td className="p-3 text-right text-blue-300">
                                    {/* El acumulado final es lo mismo que la suma de saldos */}
                                    {formatMoney(datosAnuales.length > 0 ? datosAnuales[0].saldoAcumulado : 0)}
                                </td>
                                <td className="p-3 text-center">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <h3 className="font-bold text-gray-700 mb-2">Glosario Financiero</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                        <p><strong>Gastado:</strong> Total de gastos comunes generados en el año.</p>
                        <p><strong>Recaudado:</strong> Total de pagos confirmados recibidos.</p>
                        <p><strong>Saldo Periodo:</strong> (Recaudado - Gastado). Si es positivo, hubo ahorro ese año.</p>
                        <p><strong>Saldo Acumulado:</strong> Suma histórica de los saldos. Representa la caja teórica disponible.</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
