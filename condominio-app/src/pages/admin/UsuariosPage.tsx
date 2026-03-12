/**
 * Gestión de Usuarios
 *
 * Página para administrar usuarios del sistema:
 * - Lista de usuarios con información clave
 * - Filtrar por rol y departamento
 * - Cambiar rol de usuario
 * - Asignar/desasignar de departamentos
 * - Eliminar usuarios
 */

import { useEffect, useState } from 'react'
import { Card, Button, Badge, Spinner, Modal } from '@/shared/ui'
import {
  getUsuarios,
  getDepartamentos,
  cambiarRolUsuario,
  deleteUsuario,
  updateUsuario,
  aprobarUsuario,
} from '@/shared/api'
import type { Usuario, Departamento } from '@/shared/types'
import {
  Users,
  Trash2,
  Shield,
  User,
  Building2,
  Filter,
  Mail,
  Calendar,
  CheckCircle,
} from 'lucide-react'



export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [showModalRol, setShowModalRol] = useState(false)
  const [showModalDepto, setShowModalDepto] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [nuevoRol, setNuevoRol] = useState<string>('')
  const [nuevoDepartamento, setNuevoDepartamento] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [usuariosData, deptosData] = await Promise.all([
        getUsuarios(),
        getDepartamentos(),
      ])
      setUsuarios(usuariosData)
      setDepartamentos(deptosData)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroRol === 'eliminados') return u.eliminado
    if (u.eliminado) return false // No mostrar eliminados en otros filtros
    if (filtroRol === 'pendientes') return !u.activo
    if (filtroRol === 'todos') return u.activo // Por defecto mostrar activos en "Todos"
    return u.rol === filtroRol && u.activo
  })

  // Activar/Desactivar Usuario
  const handleAprobarUsuario = async (usuario: Usuario) => {
    try {
      await aprobarUsuario(usuario.id, true)
      await cargarDatos()
    } catch (error) {
      console.error('Error aprobando usuario:', error)
      alert('Error al aprobar usuario')
    }
  }

  // Abrir modal cambiar rol
  const handleCambiarRol = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setNuevoRol(usuario.rol)
    setShowModalRol(true)
  }

  // Guardar cambio de rol
  const handleGuardarRol = async () => {
    if (!selectedUsuario || !nuevoRol) return

    try {
      setSubmitting(true)
      await cambiarRolUsuario(selectedUsuario.id, { nuevo_rol: nuevoRol as any })
      setShowModalRol(false)
      await cargarDatos()
    } catch (error) {
      console.error('Error cambiando rol:', error)
      alert('Error al cambiar el rol')
    } finally {
      setSubmitting(false)
    }
  }

  // Abrir modal cambiar departamento
  const handleCambiarDepartamento = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setNuevoDepartamento(usuario.departamento_id || '')
    setShowModalDepto(true)
  }

  // Guardar cambio de departamento
  const handleGuardarDepartamento = async () => {
    if (!selectedUsuario) return

    try {
      setSubmitting(true)
      await updateUsuario(selectedUsuario.id, {
        departamento_id: nuevoDepartamento || null,
      })
      setShowModalDepto(false)
      await cargarDatos()
    } catch (error) {
      console.error('Error actualizando departamento:', error)
      alert('Error al actualizar el departamento')
    } finally {
      setSubmitting(false)
    }
  }

  // Eliminar usuario
  const handleEliminar = async (usuario: Usuario) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await deleteUsuario(usuario.id)
      await cargarDatos()
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      alert('Error al eliminar el usuario')
    }
  }

  // Obtener nombre del departamento
  const getNombreDepartamento = (deptoId: string | null) => {
    if (!deptoId) return 'Sin asignar'
    const depto = departamentos.find((d) => d.id === deptoId)
    return depto ? `Depto ${depto.numero}` : 'Desconocido'
  }

  // Obtener icono y color según rol
  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return { icon: <Shield className="w-3 h-3" />, variant: 'error' as const, label: 'Admin' }
      case 'propietario':
        return { icon: <User className="w-3 h-3" />, variant: 'success' as const, label: 'Propietario' }
      case 'arrendatario':
        return { icon: <User className="w-3 h-3" />, variant: 'warning' as const, label: 'Arrendatario' }
      default:
        return { icon: <User className="w-3 h-3" />, variant: 'default' as const, label: rol }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra los usuarios del sistema</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usuarios.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {usuarios.filter((u) => u.rol === 'admin').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propietarios</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {usuarios.filter((u) => u.rol === 'propietario').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Arrendatarios</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {usuarios.filter((u) => u.rol === 'arrendatario').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar por rol:</span>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={filtroRol === 'todos' ? 'primary' : 'ghost'}
              onClick={() => setFiltroRol('todos')}
            >
              Todos ({usuarios.filter(u => u.activo).length})
            </Button>
            <Button
              size="sm"
              variant={filtroRol === 'admin' ? 'primary' : 'ghost'}
              onClick={() => setFiltroRol('admin')}
            >
              Admin ({usuarios.filter((u) => u.rol === 'admin' && u.activo).length})
            </Button>
            <Button
              size="sm"
              variant={filtroRol === 'propietario' ? 'primary' : 'ghost'}
              onClick={() => setFiltroRol('propietario')}
            >
              Propietarios ({usuarios.filter((u) => u.rol === 'propietario' && u.activo).length})
            </Button>
            <Button
              size="sm"
              variant={filtroRol === 'arrendatario' ? 'primary' : 'ghost'}
              onClick={() => setFiltroRol('arrendatario')}
            >
              Arrendatarios ({usuarios.filter((u) => u.rol === 'arrendatario' && u.activo).length})
            </Button>
            <Button
              size="sm"
              variant={filtroRol === 'pendientes' ? 'primary' : 'ghost'}
              className={filtroRol === 'pendientes' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'text-yellow-600 hover:bg-yellow-50'}
              onClick={() => setFiltroRol('pendientes')}
            >
              Pendientes ({usuarios.filter((u) => !u.activo && !u.eliminado).length})
            </Button>
            <Button
              size="sm"
              variant={filtroRol === 'eliminados' ? 'primary' : 'ghost'}
              className={filtroRol === 'eliminados' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'text-red-600 hover:bg-red-50'}
              onClick={() => setFiltroRol('eliminados')}
            >
              Eliminados ({usuarios.filter((u) => u.eliminado).length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Usuarios ({usuariosFiltrados.length})
          </h2>
        </div>

        {usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay usuarios con este filtro
            </h3>
            <p className="text-gray-600">Prueba con otro filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>Departamento</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Registro</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => {
                  const rolBadge = getRolBadge(usuario.rol)
                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                            {usuario.es_admin && (
                              <div className="text-xs text-red-600 flex items-center space-x-1">
                                <Shield className="w-3 h-3" />
                                <span>Administrador del sistema</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{usuario.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={rolBadge.variant}>
                          <div className="flex items-center space-x-1">
                            {rolBadge.icon}
                            <span>{rolBadge.label}</span>
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getNombreDepartamento(usuario.departamento_id || null)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(usuario.fecha_registro || 0).toLocaleDateString('es-CL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!usuario.activo ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleAprobarUsuario(usuario)}
                              title="Aprobar registro"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCambiarRol(usuario)}
                                title="Cambiar rol"
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCambiarDepartamento(usuario)}
                                title="Cambiar departamento"
                              >
                                <Building2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminar(usuario)}
                            title="Eliminar"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Cambiar Rol */}
      <Modal
        isOpen={showModalRol}
        onClose={() => setShowModalRol(false)}
        title="Cambiar Rol de Usuario"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Usuario:</p>
            <p className="font-medium text-gray-900">{selectedUsuario?.nombre}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo Rol</label>
            <select
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="admin">Administrador</option>
              <option value="propietario">Propietario</option>
              <option value="arrendatario">Arrendatario</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Cambiar el rol afectará los permisos y accesos del usuario en el
              sistema.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModalRol(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarRol} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cambiar Departamento */}
      <Modal
        isOpen={showModalDepto}
        onClose={() => setShowModalDepto(false)}
        title="Asignar Departamento"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Usuario:</p>
            <p className="font-medium text-gray-900">{selectedUsuario?.nombre}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
            <select
              value={nuevoDepartamento}
              onChange={(e) => setNuevoDepartamento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sin asignar</option>
              {departamentos.map((depto) => (
                <option key={depto.id} value={depto.id}>
                  Depto {depto.numero} - {depto.propietario}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="ghost" onClick={() => setShowModalDepto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarDepartamento} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
