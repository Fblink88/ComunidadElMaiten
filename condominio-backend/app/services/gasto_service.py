"""
Servicio de Gastos.

Este servicio contiene la lógica de negocio relacionada con
los gastos mensuales y extraordinarios del condominio.
"""

from typing import Optional, List, Dict, Any
from app.repositories import GastoRepository, DepartamentoRepository, PagoRepository
from app.models import GastoMensualCreate, GastoExtraordinarioCreate


class GastoService:
    """
    Servicio para operaciones de gastos.
    
    Maneja la lógica de negocio como cálculo de cuotas
    por metro cuadrado y gestión de pagos.
    """
    
    def __init__(self):
        """Inicializa el servicio con los repositorios necesarios."""
        self.gasto_repo = GastoRepository()
        self.depto_repo = DepartamentoRepository()
        self.pago_repo = PagoRepository()
    
    # ============================================
    # GASTOS MENSUALES
    # ============================================
    
    def crear_gasto_mensual(
        self,
        data: GastoMensualCreate,
        usuario_solicitante: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crea un nuevo gasto mensual y genera los pagos para cada departamento.
        
        Args:
            data: Datos del gasto mensual
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el gasto creado
            
        Raises:
            PermissionError: Si no es admin
            ValueError: Si ya existe gasto para ese periodo
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden crear gastos")
        
        # Verificar que no exista gasto para ese periodo
        existente = self.gasto_repo.get_by_periodo(data.periodo)
        if existente:
            raise ValueError(f"Ya existe un gasto para el periodo {data.periodo}")
        
        # Calcular total
        total = sum(item.monto for item in data.items)
        
        # Obtener total de metros cuadrados
        total_m2 = self.depto_repo.get_total_metros_cuadrados()
        if total_m2 == 0:
            raise ValueError("No hay departamentos activos para distribuir gastos")
        
        # Calcular valor por m²
        valor_por_m2 = total / total_m2
        
        # Preparar datos
        gasto_data = {
            'periodo': data.periodo,
            'items': [item.model_dump() for item in data.items],
            'total': total,
            'valor_por_m2': round(valor_por_m2, 2)
        }
        
        # Crear gasto mensual
        gasto = self.gasto_repo.create_mensual(data.periodo, gasto_data)
        
        # Generar pagos pendientes para cada departamento
        self._generar_pagos_departamentos(data.periodo, valor_por_m2)
        
        return gasto
    
    def _generar_pagos_departamentos(self, periodo: str, valor_por_m2: float):
        """
        Genera los pagos pendientes para cada departamento activo.
        
        Args:
            periodo: Periodo del gasto
            valor_por_m2: Valor calculado por metro cuadrado
        """
        departamentos = self.depto_repo.get_activos()
        
        for depto in departamentos:
            # Calcular monto según metros cuadrados
            m2 = depto.get('metros_cuadrados', 0)
            monto = round(m2 * valor_por_m2)
            
            # Verificar que no exista pago para ese periodo
            existente = self.pago_repo.get_by_departamento_y_periodo(
                depto['id'], 
                periodo
            )
            
            if not existente:
                # Crear pago pendiente
                self.pago_repo.create({
                    'departamento_id': depto['id'],
                    'periodo': periodo,
                    'monto': monto,
                    'estado': 'pendiente',
                    'metodo': None,
                    'flow_payment_id': None,
                    'fecha_pago': None
                })
            
            # Actualizar cuota mensual del departamento
            self.depto_repo.update(depto['id'], {'cuota_mensual': monto})
    
    def obtener_gasto_mensual(self, periodo: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el gasto mensual de un periodo.
        
        Args:
            periodo: Periodo en formato 'YYYY-MM'
            
        Returns:
            Diccionario con el gasto o None
        """
        return self.gasto_repo.get_by_periodo(periodo)
    
    def obtener_ultimos_gastos(self, cantidad: int = 12) -> List[Dict[str, Any]]:
        """
        Obtiene los últimos gastos mensuales.
        
        Args:
            cantidad: Número de periodos a obtener
            
        Returns:
            Lista de gastos mensuales
        """
        return self.gasto_repo.get_ultimos_periodos(cantidad)
    
    # ============================================
    # GASTOS EXTRAORDINARIOS
    # ============================================
    
    def crear_gasto_extraordinario(
        self,
        data: GastoExtraordinarioCreate,
        usuario_solicitante: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Crea un nuevo gasto extraordinario.
        
        Args:
            data: Datos del gasto extraordinario
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            Diccionario con el gasto creado
            
        Raises:
            PermissionError: Si no es admin
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden crear gastos extraordinarios")
        
        gasto_data = data.model_dump()
        
        return self.gasto_repo.create_extraordinario(gasto_data)
    
    def obtener_gasto_extraordinario(self, gasto_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un gasto extraordinario por su ID.
        
        Args:
            gasto_id: ID del gasto
            
        Returns:
            Diccionario con el gasto o None
        """
        return self.gasto_repo.get_extraordinario(gasto_id)
    
    def obtener_gastos_extraordinarios(self) -> List[Dict[str, Any]]:
        """
        Obtiene todos los gastos extraordinarios.
        
        Returns:
            Lista de gastos extraordinarios
        """
        return self.gasto_repo.get_all_extraordinarios()
    
    def marcar_pago_extraordinario(
        self,
        gasto_id: str,
        departamento_id: str,
        usuario_solicitante: Dict[str, Any]
    ) -> bool:
        """
        Marca el pago de un gasto extraordinario para un departamento.
        
        Args:
            gasto_id: ID del gasto extraordinario
            departamento_id: ID del departamento
            usuario_solicitante: Usuario que realiza la operación
            
        Returns:
            True si se marcó correctamente
            
        Raises:
            PermissionError: Si no es admin
        """
        if not usuario_solicitante.get('es_admin', False):
            raise PermissionError("Solo administradores pueden marcar pagos extraordinarios")
        
        return self.gasto_repo.marcar_pago_extraordinario(gasto_id, departamento_id)