from django.db import models
from cuentas.models import Cuenta
from django.core.exceptions import ValidationError
from django.db.models import Sum


class Movimiento(models.Model):

    ESTADO = [
        ('PENDIENTE', 'Pendiente'),
        ('ACREDITADO', 'Acreditado'),
    ]

    MONEDA = [
        ('USD', 'USD'),
        ('UYU', 'UYU'),
    ]

    fecha = models.DateField()
    cuenta = models.ForeignKey(Cuenta, on_delete=models.PROTECT)
    descripcion = models.CharField(max_length=200)
    moneda = models.CharField(max_length=3, choices=MONEDA)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    estado = models.CharField(max_length=10, choices=ESTADO, default='PENDIENTE')

    def __str__(self):
        return f"{self.fecha} - {self.descripcion} - {self.monto}"

    def clean(self):

        from rubros.models import MovimientoRubro
        from finanzas.models import PeriodoContable

        if not self.pk:
            return

        # 1) Verificar si el período está cerrado
        periodo = PeriodoContable.objects.filter(
            anio=self.fecha.year,
            mes=self.fecha.month,
            cerrado=True
        ).first()

        if periodo:
            raise ValidationError("El período contable está cerrado")

        # 2) Validar suma de rubros
        rubros = MovimientoRubro.objects.filter(movimiento=self)

        total_rubros = rubros.aggregate(
            total=Sum("monto")
        )["total"] or 0

        if total_rubros != self.monto:
            raise ValidationError(
                f"La suma de rubros ({total_rubros}) no coincide con el monto del movimiento ({self.monto})"
            )

        # 3) Validar signo
        for r in rubros:

            if self.monto < 0 and r.monto > 0:
                raise ValidationError(
                    f"El rubro {r.rubro} debe ser negativo porque el movimiento es egreso"
                )

            if self.monto > 0 and r.monto < 0:
                raise ValidationError(
                    f"El rubro {r.rubro} debe ser positivo porque el movimiento es ingreso"
                )