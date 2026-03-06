from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class BilleteraMovimientoBase(BaseModel):
    """
    Información base de un movimiento de la billetera virtual.
    """
    departamento_id: str = Field(..., description="ID del departamento")
    monto_cambio: int = Field(..., description="Monto del ajuste (negativo para retirar, positivo para agregar)")
    saldo_resultante: int = Field(..., description="Saldo a favor que quedó después de este movimiento")
    motivo: str = Field(..., min_length=3, max_length=255, description="Razón o justificación del ajuste")
    usuario_admin_id: Optional[str] = Field(None, description="ID del administrador que realizó el ajuste (si aplica)")


class BilleteraMovimientoCreate(BilleteraMovimientoBase):
    """
    Schema para crear un nuevo registro de movimiento.
    """
    fecha: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Fecha en que se registró el movimiento")


class BilleteraMovimientoResponse(BilleteraMovimientoBase):
    """
    Schema para representar un movimiento cuando se expone a la API.
    """
    id: str = Field(..., description="ID único del movimiento")
    fecha: datetime = Field(..., description="Fecha del movimiento")

    model_config = {
        "from_attributes": True,
        "extra": "ignore"
    }


class AjusteBilleteraRequest(BaseModel):
    """
    Schema con los datos que enviará el frontend para registrar un ajuste manual.
    """
    monto: int = Field(..., description="Monto del ajuste (negativo para retirar, positivo para agregar. Ej: -37254)")
    motivo: str = Field(..., min_length=5, max_length=255, description="Motivo del ajuste. Ej: 'Devolución transferencia duplicada'")
