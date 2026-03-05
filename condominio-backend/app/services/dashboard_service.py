"""
Servicio del Dashboard.

Lógica de negocio para calcular métricas financieras globales.
"""

from typing import Dict, Any
from app.repositories import PagoRepository, GastoRepository

class DashboardService:
    """
    Servicio para agregar y calcular métricas del dashboard.
    """
    
    def __init__(self):
        self.pago_repo = PagoRepository()
        self.gasto_repo = GastoRepository()
        
    async def obtener_resumen_global(self) -> Dict[str, Any]:
        """
        Calcula el resumen financiero global.
        
        Returns:
            Datos financieros agregados.
        """
        # 1. Total Recaudado (Pagos con estado 'pagado')
        # Nota: Idealmente esto se haría con una query de agregación en DB,
        # pero Firestore no soporta SUM nativo fácilmente sin contar documentos.
        # Para MVP, traemos los documentos y sumamos en memoria (cuidado con escalabilidad futura).
        pagos_pagados = await self.pago_repo.find_by_field('estado', 'pagado')
        total_recaudado = sum(p.get('monto', 0) for p in pagos_pagados)
        
        # 2. Total Gastos (Suma de 'total' en gastos mensuales)
        gastos = await self.gasto_repo.get_ultimos_periodos(cantidad=1000) # Traer todos
        total_gastos = sum(g.get('total', 0) for g in gastos)
        
        # 3. Morosidad (Pagos pendientes)
        pagos_pendientes = await self.pago_repo.find_by_field('estado', 'pendiente')
        morosidad_total = sum(p.get('monto', 0) for p in pagos_pendientes)
        
        # 4. Balance
        # Asumimos saldo inicial 0 por ahora
        balance_actual = total_recaudado - total_gastos
        
        return {
            "total_recaudado": total_recaudado,
            "total_gastos": total_gastos,
            "balance_actual": balance_actual,
            "morosidad_total": morosidad_total
        }

# Instancia global
dashboard_service = DashboardService()
