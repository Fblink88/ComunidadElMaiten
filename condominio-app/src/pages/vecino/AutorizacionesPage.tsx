/**
 * Página de Usuarios de mi Departamento
 *
 * Exclusiva para propietarios:
 * - Ver solicitudes de registro pendientes para su departamento (aprobar/rechazar)
 * - Ver la lista de residentes actuales (vecinos y arrendatarios aprobados)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { collection, query, getDocs, where, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { arrayUnion } from 'firebase/firestore'
import { db } from '@/shared/config/firebase'
import type { Usuario } from '@/shared/types'
import { Clock, UserCheck, X, Users, UserRound } from 'lucide-react'

export const AutorizacionesPage = () => {
  const { usuario } = useAuth()

  // Estado para solicitudes pendientes
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<Usuario[]>([])
  const [loadingPendientes, setLoadingPendientes] = useState(false)

  // Estado para residentes actuales (activos)
  const [residentes, setResidentes] = useState<Usuario[]>([])
  const [loadingResidentes, setLoadingResidentes] = useState(false)

  // Cargar solicitudes pendientes de registro para el departamento del propietario
  useEffect(() => {
    if (usuario?.rol !== 'propietario' || !(usuario.departamento_id || usuario.departamentoId)) return

    const deptoId = usuario.departamento_id || usuario.departamentoId!
    setLoadingPendientes(true)

    // Obtener el número de departamento del propietario para buscar las solicitudes por número,
    // y de paso usamos el ID para buscar los residentes actuales.
    const fetchDatos = async () => {
      setLoadingPendientes(true)
      setLoadingResidentes(true)
      try {
        const deptoSnap = await getDocs(query(collection(db, 'departamentos'), where('__name__', '==', deptoId)))
        if (deptoSnap.empty) return
        const deptoNumero = deptoSnap.docs[0].data().numero

        // 1. Buscar TODOS los usuarios pendientes y filtrar en JS por número de depto
        const qPendientes = query(
          collection(db, 'usuarios'),
          where('estado_cuenta', '==', 'pendiente_aprobacion')
        )

        const snapPendientes = await getDocs(qPendientes)
        const allPending = snapPendientes.docs.map(d => ({ id: d.id, ...d.data() })) as Usuario[]

        const matchDept = allPending.filter(u => u.departamento_solicitado_numero === deptoNumero)
        setSolicitudesPendientes(matchDept.filter(u => u.rol === 'vecino' || u.rol === 'arrendatario'))

        // 2. Buscar TODOS los residentes activos del departamento por ID
        const qResidentes = query(
          collection(db, 'usuarios'),
          where('departamento_id', '==', deptoId),
          where('estado_cuenta', '==', 'activo')
        )
        const snapResidentes = await getDocs(qResidentes)
        const residentesData = snapResidentes.docs.map(d => ({ id: d.id, ...d.data() })) as Usuario[]
        // Excluimos al propio propietario de esta lista para solo mostrar "otros"
        setResidentes(residentesData.filter(u => u.id !== usuario.id))

      } catch (error) {
        console.error("Error cargando datos del departamento:", error)
      } finally {
        setLoadingPendientes(false)
        setLoadingResidentes(false)
      }
    }

    fetchDatos()
  }, [usuario])

  const handleAprobar = async (solicitante: Usuario) => {
    const deptoId = usuario?.departamento_id || usuario?.departamentoId!
    if (!confirm(`¿Aprobar a ${solicitante.nombre} como ${solicitante.rol} de tu departamento?`)) return
    try {
      await updateDoc(doc(db, 'usuarios', solicitante.id), {
        departamento_id: deptoId,
        departamentoId: deptoId,
        estado_cuenta: 'activo',
        activo: true,
        departamento_solicitado_numero: null,
      })
      await updateDoc(doc(db, 'departamentos', deptoId), {
        usuarios_ids: arrayUnion(solicitante.id)
      })
      setSolicitudesPendientes(prev => prev.filter(u => u.id !== solicitante.id))
      // También lo agregamos visualmente a la lista de residentes activos de inmediato
      setResidentes(prev => [...prev, { ...solicitante, estado_cuenta: 'activo', activo: true, departamento_id: deptoId, departamentoId: deptoId }])
    } catch (err) {
      console.error('Error al aprobar:', err)
      alert('Error al aprobar el acceso.')
    }
  }

  const handleRechazar = async (solicitante: Usuario) => {
    if (!confirm(`¿Rechazar la solicitud de ${solicitante.nombre}?`)) return
    try {
      await deleteDoc(doc(db, 'usuarios', solicitante.id))
      setSolicitudesPendientes(prev => prev.filter(u => u.id !== solicitante.id))
    } catch (err) {
      console.error('Error al rechazar:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios de Mi Departamento</h1>
        <p className="text-gray-500 mt-1">
          Gestiona las solicitudes de acceso y revisa quiénes están registrados como residentes.
        </p>
      </div>

      {/* ============================== */}
      {/* Solicitudes de Registro (solo propietarios) */}
      {/* ============================== */}
      <div>
        {loadingPendientes ? (
          <div className="text-sm text-gray-400">Cargando solicitudes...</div>
        ) : solicitudesPendientes.length > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h2 className="text-base font-semibold text-yellow-800">
                Solicitudes de Acceso Pendientes ({solicitudesPendientes.length})
              </h2>
            </div>
            <div className="space-y-3">
              {solicitudesPendientes.map(u => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-lg border border-yellow-200 p-4 shadow-sm">
                  <div>
                    <div className="font-medium text-gray-900">{u.nombre}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Rol solicitado: <span className="capitalize font-medium">{u.rol}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAprobar(u)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleRechazar(u)}
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
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm text-gray-500 flex flex-col items-center justify-center text-center">
            <UserCheck className="h-8 w-8 text-gray-300 mb-2" />
            <p>No hay solicitudes de acceso pendientes para tu departamento.</p>
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* Lista de Residentes Activos */}
      {/* ============================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Residentes Actuales</h2>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {residentes.length} {residentes.length === 1 ? 'Residente' : 'Residentes'}
          </span>
        </div>

        {loadingResidentes ? (
          <div className="p-6 text-sm text-center text-gray-400">Cargando residentes...</div>
        ) : residentes.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 text-gray-500 text-sm">
            <UserRound className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            No hay otros vecinos o arrendatarios registrados en tu departamento actualmente.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {residentes.map(r => (
              <li key={r.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {r.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{r.nombre}</div>
                    <div className="text-sm text-gray-500">{r.email}</div>
                  </div>
                </div>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.rol === 'arrendatario' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {r.rol.charAt(0).toUpperCase() + r.rol.slice(1)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
