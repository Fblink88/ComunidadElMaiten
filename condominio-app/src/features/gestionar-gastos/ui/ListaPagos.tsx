// ... imports
import { useState, useEffect } from "react"
import { Card, Badge, Button, Spinner } from "@/shared/ui"
import { getAllPagos, getDepartamentos } from "@/shared/api"
import type { Pago } from "@/shared/types"

interface ListaPagosProps {
  onSeleccionarPago: (pago: Pago) => void
}

export const ListaPagos = ({ onSeleccionarPago }: ListaPagosProps) => {
  // Estado de datos
  const [todosLosPagos, setTodosLosPagos] = useState<Pago[]>([])
  const [pagosFiltrados, setPagosFiltrados] = useState<Pago[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroDepto, setFiltroDepto] = useState<string>("")
  const [filtroFecha, setFiltroFecha] = useState<string>("")

  // Mapa de departamentos
  const [deptosMap, setDeptosMap] = useState<Record<string, string>>({})

  // Cargar datos iniciales (solo una vez)
  useEffect(() => {
    cargarDatos()
  }, [])

  // Filtrar datos cuando cambian los filtros o la data base
  useEffect(() => {
    filtrarPagos()
  }, [todosLosPagos, filtroEstado, filtroDepto, filtroFecha, deptosMap])

  const cargarDatos = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [pagosData, deptosData] = await Promise.all([
        getAllPagos(),
        getDepartamentos()
      ])

      // Mapa de deptos
      const mapa: Record<string, string> = {}
      deptosData.forEach(d => {
        mapa[d.id] = d.numero
      })
      setDeptosMap(mapa)

      // Guardar todos los pagos
      setTodosLosPagos(pagosData)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  const filtrarPagos = () => {
    let data = [...todosLosPagos]

    // 1. Filtro por Estado
    if (filtroEstado !== "todos") {
      data = data.filter(p => p.estado === filtroEstado)
    }

    // 2. Filtro por Departamento (busca en el número mapeado)
    if (filtroDepto.trim()) {
      const busqueda = filtroDepto.toLowerCase().trim()
      data = data.filter(p => {
        const numDepto = p.departamento_id ? (deptosMap[p.departamento_id] || "") : ""
        return numDepto.toLowerCase().includes(busqueda)
      })
    }

    // 3. Filtro por Fecha (busca en fecha creacion o periodo)
    if (filtroFecha) {
      // Si el input es fecha (YYYY-MM-DD), comparamos con created_at formateado
      // O si el usuario escribe "2024-01", busca en periodo
      const busqueda = filtroFecha.toLowerCase()
      data = data.filter(p => {
        const fechaCreacion = p.created_at ? p.created_at.substring(0, 10) : '' // YYYY-MM-DD
        const periodo = p.periodo.toLowerCase()
        return fechaCreacion.includes(busqueda) || periodo.includes(busqueda)
      })
    }

    // Ordenar: más recientes primero
    data.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    setPagosFiltrados(data)
  }

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "pagado": return "success"
      case "verificando": return "warning"
      case "rechazado": return "error"
      default: return "default"
    }
  }

  const getEstadoTexto = (estado: string) => {
    const map: Record<string, string> = {
      pagado: "Pagado",
      verificando: "Verificando",
      rechazado: "Rechazado",
      pendiente: "Pendiente"
    }
    return map[estado] || estado
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(monto)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) return <div className="flex justify-center p-10"><Spinner /></div>
  if (error) return (
    <Card>
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
        <Button onClick={cargarDatos} className="mt-2">Reintentar</Button>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Panel de Filtros */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">

          {/* Botones de Estado - Izquierda */}
          <div className="flex gap-2 flex-wrap">
            {["todos", "verificando", "pagado", "pendiente", "rechazado"].map(estado => (
              <Button
                key={estado}
                variant={filtroEstado === estado ? "primary" : "secondary"}
                onClick={() => setFiltroEstado(estado)}
                className="capitalize"
              >
                {estado}
              </Button>
            ))}
          </div>

          {/* Inputs de Búsqueda - Derecha */}
          <div className="flex gap-4 flex-wrap items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                placeholder="Ej: 101"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroDepto}
                onChange={(e) => setFiltroDepto(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
              </label>
              <input
                type="month"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>

            {(filtroDepto || filtroFecha || filtroEstado !== 'todos') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFiltroDepto("")
                  setFiltroFecha("")
                  setFiltroEstado("todos")
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Lista de Pagos */}
      {pagosFiltrados.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-500">
            No se encontraron pagos con los filtros seleccionados.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {pagosFiltrados.map((pago) => (
            <Card key={pago.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Departamento {pago.departamento_id ? (deptosMap[pago.departamento_id] || pago.departamento_id) : 'Desconocido'}
                    </h3>
                    <Badge variant={getEstadoBadgeVariant(pago.estado)}>
                      {getEstadoTexto(pago.estado)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Periodo</p>
                      <p className="font-medium">{pago.periodo === 'SALDO' ? 'Abono Billetera' : pago.periodo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monto</p>
                      <p className="font-medium text-green-600">
                        {formatearMonto(pago.monto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Método</p>
                      <p className="font-medium">
                        {pago.metodo === "transferencia_manual" ? "Transferencia" :
                          pago.metodo === 'importacion_historica' ? "Transferencia Manual" :
                            pago.metodo === 'saldo_a_favor' ? "Billetera" : "Khipu"}
                      </p>
                    </div>
                    {pago.nombre_pagador && (
                      <div>
                        <p className="text-gray-500">Pagador</p>
                        <p className="font-medium">{pago.nombre_pagador}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Creado: {formatearFecha(pago.created_at || '')}
                  </div>

                  {pago.estado === "rechazado" && pago.notas && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded text-sm text-red-700">
                      <strong>Motivo de rechazo:</strong> {pago.notas}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button onClick={() => onSeleccionarPago(pago)}>
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
