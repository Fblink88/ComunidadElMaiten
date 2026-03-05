/**
 * Página de Reporte Financiero
 * 
 * Muestra una grilla con el estado de pagos de todos los departamentos
 * para los últimos 24 meses.
 * 
 * Referencia visual: Excel del usuario.
 * Filas: Departamentos
 * Columnas: Meses (últimos 24)
 * Celdas: Estado del pago (Verde=Pagado, Amarillo=Verificando, Rojo=Deuda/Rechazado)
 * Última columna: Deuda total acumulada
 */

import { useState, useEffect } from "react"
import { Button, Spinner } from "@/shared/ui"
import { getAllPagos, getDepartamentos, getGastosMensuales, getAllTransacciones } from "@/shared/api"
import type { Pago, Departamento, GastoMensual, Transaccion } from "@/shared/types"
import { ReporteResumenMensual } from "./components/ReporteResumenMensual"
import { ReporteResumenDepartamentos } from "./components/ReporteResumenDepartamentos"
import { ReporteBalanceAnual } from "./components/ReporteBalanceAnual"

export const ReporteFinancieroPage = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'mensual' | 'departamentos' | 'anual'>('mensual')

    // Datos
    const [departamentos, setDepartamentos] = useState<Departamento[]>([])
    const [gastos, setGastos] = useState<GastoMensual[]>([])
    const [pagos, setPagos] = useState<Pago[]>([])
    const [transacciones, setTransacciones] = useState<Transaccion[]>([])

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        setError(null)
        try {
            // Cargar todo en paralelo
            // Aumentamos a 60 meses (5 años) para el reporte anual histórico
            const [deptosData, gastosData, pagosData, transData] = await Promise.all([
                getDepartamentos(),
                getGastosMensuales(60),
                getAllPagos(1000),
                getAllTransacciones(1000)
            ])

            // Ordenar departamentos por número
            const deptosOrdenados = deptosData.sort((a, b) =>
                parseInt(a.numero) - parseInt(b.numero)
            )

            // Ordenar gastos cronológicamente ascendente (antiguo -> nuevo) para las funciones helpers
            const gastosOrdenados = gastosData.sort((a, b) =>
                a.periodo.localeCompare(b.periodo)
            )

            setDepartamentos(deptosOrdenados)
            setGastos(gastosOrdenados)
            setPagos(pagosData)
            setTransacciones(transData)

        } catch (err) {
            console.error(err)
            setError("Error al cargar el reporte financiero")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-10"><Spinner /></div>
    if (error) return <div className="p-4 text-red-600 font-bold">{error}</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
                <Button onClick={cargarDatos} variant="secondary">Actualizar Datos</Button>
            </div>

            {/* Tabs de Navegación */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'mensual'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('mensual')}
                >
                    Resumen Mensual
                </button>
                <button
                    className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'departamentos'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('departamentos')}
                >
                    Resumen por Depto.
                </button>
                <button
                    className={`px-6 py-3 font-medium text-sm focus:outline-none ${activeTab === 'anual'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('anual')}
                >
                    Balance Anual
                </button>
            </div>

            {/* Contenido de Tabs */}
            <div className="pt-2">
                {activeTab === 'mensual' && (
                    <ReporteResumenMensual
                        pagos={pagos}
                        departamentos={departamentos}
                        gastos={gastos} // Pasamos todos, el componente renderiza lo que recibe
                        isLoading={false}
                    />
                )}
                {activeTab === 'departamentos' && (
                    <ReporteResumenDepartamentos
                        pagos={pagos}
                        departamentos={departamentos}
                        transacciones={transacciones}
                        isLoading={false}
                    />
                )}
                {activeTab === 'anual' && (
                    <ReporteBalanceAnual
                        pagos={pagos}
                        departamentos={departamentos}
                        gastos={gastos} // El componente agrupará por año
                        isLoading={false}
                    />
                )}
            </div>
        </div>
    )
}
