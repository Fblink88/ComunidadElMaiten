import { useState, useEffect } from "react"
import { Card, Spinner } from "@/shared/ui"
import { getMisPagos, getGastosMensuales, getDepartamento, getMisTransacciones, getHistorialBilletera } from "@/shared/api"
import type { Pago } from "@/shared/types"

type MovimientoUnificado = {
    id: string;
    fecha: string;
    monto: number;
    metodo: string;
    notas: string;
    tipo: 'abono' | 'ajuste';
}
import { useAuth } from "@/app/providers"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, CreditCard, AlertCircle, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"

export const HistorialPage = () => {
    const { usuario } = useAuth()
    const [movimientos, setMovimientos] = useState<Pago[]>([])
    const [transacciones, setTransacciones] = useState<MovimientoUnificado[]>([])
    const [tab, setTab] = useState<'deudas' | 'abonos'>('deudas')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (usuario?.departamento_id) {
            cargarHistorial()
        }
    }, [usuario?.departamento_id])

    const cargarHistorial = async () => {
        try {
            if (!usuario?.departamento_id) return

            // 1. Cargar datos en paralelo
            console.log("Cargando historial para depto:", usuario.departamento_id)
            const [pagosData, gastosData, deptoData, transaccionesData, billeteraData] = await Promise.all([
                getMisPagos(),
                getGastosMensuales(24), // Últimos 24 meses
                getDepartamento(usuario.departamento_id),
                getMisTransacciones(),
                getHistorialBilletera(usuario.departamento_id)
            ])

            console.log("Datos cargados:", {
                pagos: pagosData.length,
                gastos: gastosData.length,
                transacciones: transaccionesData.length,
                depto: deptoData.id
            })

            // Validación de seguridad
            if (gastosData.length === 0) {
                console.warn("No se encontraron gastos mensuales. El historial de deuda no se puede calcular.")
            }

            // 2. Procesar pagos existentes
            const pagosMap = new Map<string, Pago>()
            pagosData.forEach((p: Pago) => pagosMap.set(p.periodo, p))

            // 3. Generar lista unificada (Pagos reales + Deudas)
            const historialCompleto: Pago[] = []

            // Iteramos sobre los gastos (meses que deberían estar pagados)
            gastosData.forEach((gasto: any) => {
                const pagoExistente = pagosMap.get(gasto.periodo)

                if (pagoExistente) {
                    // Si existe pago, lo usamos tal cual
                    historialCompleto.push(pagoExistente)
                } else {
                    // Si NO existe pago, creamos uno "virtual" con estado pendiente/deuda
                    const montoCalculado = Math.round(gasto.valor_por_m2 * deptoData.metros_cuadrados)

                    const pagoVirtual: Pago = {
                        id: `virtual-${gasto.periodo}`,
                        departamento_id: deptoData.id,
                        monto: montoCalculado,
                        periodo: gasto.periodo,
                        estado: 'pendiente', // Usamos 'pendiente' para representar deuda
                        metodo: null,
                        created_at: new Date().toISOString(), // Fecha actual o del gasto
                        // Propiedades opcionales
                        fecha_pago: null,
                        fecha_transferencia: null,
                        nombre_pagador: null,
                        verificado_por: null,
                        notas: "Pago pendiente generado automáticamente",
                        khipu_payment_id: null
                    }
                    historialCompleto.push(pagoVirtual)
                }
            })

            // Agregar pagos extraordinarios o que no calcen con gastos mensuales si los hubiera
            // (Opcional: Por ahora asumimos que todos los pagos corresponden a un gasto mensual)
            // Si hubiera pagos en pagosData que NO están en gastosData (ej: pagos adelantados),
            // deberíamos agregarlos también.
            pagosData.forEach((p: Pago) => {
                if (!gastosData.find((g: any) => g.periodo === p.periodo)) {
                    historialCompleto.push(p)
                }
            })

            // 4. Ordenar: Mes más reciente primero
            const ordenados = historialCompleto.sort((a, b) =>
                b.periodo.localeCompare(a.periodo)
            )

            const unificados: MovimientoUnificado[] = [
                ...transaccionesData.map(t => ({
                    id: t.id,
                    fecha: t.fecha,
                    monto: t.monto_total,
                    metodo: t.metodo,
                    notas: t.notas || '-',
                    tipo: 'abono' as const
                })),
                ...billeteraData.map(b => ({
                    id: b.id,
                    fecha: b.fecha,
                    monto: b.monto_cambio,
                    metodo: 'Ajuste/Devolución',
                    notas: b.motivo || '-',
                    tipo: 'ajuste' as const
                }))
            ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

            setMovimientos(ordenados)
            setTransacciones(unificados)
        } catch (err) {
            console.error("Error cargando historial:", err)
            setError("No se pudo cargar el historial de pagos.")
        } finally {
            setLoading(false)
        }
    }

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pagado':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Pagado
                    </span>
                )
            case 'verificando':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Verificando
                    </span>
                )
            case 'rechazado':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rechazado
                    </span>
                )
            case 'pendiente':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Pendiente
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {estado}
                    </span>
                )
        }
    }

    const getMetodoIcon = (metodo: string | null) => {
        if (!metodo) return <span className="text-red-500 text-xs italic">No pagado</span>
        if (metodo === 'khipu') return "Khipu (Web)"
        if (metodo === 'saldo_a_favor') return "Saldo a Favor"
        return "Transferencia"
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Historial de Movimientos
            </h1>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 border-b-2 ${tab === 'deudas' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setTab('deudas')}
                >
                    Historial de Deudas
                </button>
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors duration-200 border-b-2 ${tab === 'abonos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setTab('abonos')}
                >
                    Historial Billetera Virtual
                </button>
            </div>

            {tab === 'deudas' ? (
                <>
                    {movimientos.length === 0 ? (
                        <Card>
                            <div className="text-center py-8 text-gray-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No tienes deudas registradas en el historial.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Periodo
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha Pago
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Monto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Método
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pagado Por
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {movimientos.map((pago) => (
                                            <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-medium text-gray-900">
                                                        {pago.periodo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {pago.fecha_pago
                                                        ? format(new Date(pago.fecha_pago), "dd/MM/yyyy HH:mm", { locale: es })
                                                        : pago.estado === 'pendiente'
                                                            ? <span className="text-gray-400 italic text-xs">Pendiente de pago</span>
                                                            : format(new Date(pago.created_at as string), "dd/MM/yyyy HH:mm", { locale: es })
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    $ {pago.monto.toLocaleString('es-CL')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        {pago.metodo && <CreditCard className="w-4 h-4 text-gray-400" />}
                                                        {getMetodoIcon(pago.metodo)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {pago.nombre_pagador || (pago.metodo === 'saldo_a_favor' ? 'Saldo a Favor' : '-')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getEstadoBadge(pago.estado)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {transacciones.length === 0 ? (
                        <Card>
                            <div className="text-center py-8 text-gray-500">
                                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No tienes movimientos en la billetera virtual.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Monto
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Método
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Notas
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {transacciones.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(t.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                                    <span className={t.monto >= 0 ? "text-green-600" : "text-red-600"}>
                                                        {t.monto > 0 ? '+ ' : ''}$ {Math.abs(t.monto).toLocaleString('es-CL')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <CreditCard className="w-4 h-4 text-gray-400" />
                                                        {getMetodoIcon(t.metodo)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {t.notas}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
