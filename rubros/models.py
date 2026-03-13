from django.db import models
from django.core.exceptions import ValidationError
from proveedores.models import Proveedor


class Rubro(models.Model):

    TIPO_RESULTADO = [
        ('INGRESO', 'Ingreso'),
        ('EGRESO', 'Egreso'),
        ('NEUTRO', 'Neutro'),
    ]

    nombre = models.CharField(max_length=150)

    tipo_resultado = models.CharField(
        max_length=10,
        choices=TIPO_RESULTADO
    )

    afecta_banco = models.BooleanField(default=True)

    requiere_proveedor = models.BooleanField(default=False)

    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.tipo_resultado})"


class MovimientoRubro(models.Model):

    movimiento = models.ForeignKey(
        "movimientos.Movimiento",
        on_delete=models.CASCADE,
        related_name="rubros"
    )

    rubro = models.ForeignKey(
        Rubro,
        on_delete=models.PROTECT
    )

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    def clean(self):

        if self.rubro.requiere_proveedor and not self.proveedor:
            raise ValidationError(
                f"El rubro '{self.rubro}' requiere un proveedor."
            )

    def __str__(self):
        return f"{self.movimiento} - {self.rubro} - {self.monto}"