/**
 * Componente Modal
 * 
 * Este archivo contiene el componente de modal/diálogo reutilizable.
 * Sirve para mostrar contenido superpuesto que requiere atención del usuario.
 * 
 * Uso típico:
 * - Confirmación antes de eliminar algo
 * - Formularios de edición rápida
 * - Mensajes importantes
 * - Detalles de un pago o gasto
 */

import type { ReactNode } from "react"
import { X } from "lucide-react"

/**
 * Props del componente Modal.
 */
interface ModalProps {
  /** Controla si el modal está visible */
  isOpen: boolean
  /** Función que se ejecuta al cerrar el modal */
  onClose: () => void
  /** Título del modal */
  title: string
  /** Contenido del modal */
  children: ReactNode
  /** Tamaño del modal */
  size?: "sm" | "md" | "lg"
}

/**
 * Componente Modal para diálogos y contenido superpuesto.
 * 
 * @example
 * // Modal básico
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirmar">
 *   <p>¿Estás seguro de eliminar este pago?</p>
 *   <Button onClick={() => setIsOpen(false)}>Cancelar</Button>
 *   <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
 * </Modal>
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) => {
  /**
   * Si el modal no está abierto, no renderiza nada.
   */
  if (!isOpen) return null

  /**
   * Estilos de tamaño del modal.
   */
  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  }

  /**
   * Maneja el clic en el overlay (fondo oscuro).
   * Cierra el modal al hacer clic fuera del contenido.
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      {/* Contenedor del modal */}
      <div
        className={`${sizeStyles[size]} w-full bg-white rounded-xl shadow-xl`}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}