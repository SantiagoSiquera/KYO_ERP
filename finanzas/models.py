from django.db import models
from cuentas.models import Cuenta

class PeriodoContable(models.Model):
    anio = models.IntegerField()
    mes = models.IntegerField()

    cerrado = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("anio", "mes")

    def __str__(self):
        estado = "CERRADO" if self.cerrado else "ABIERTO"
        return f"{self.anio}-{self.mes:02d} ({estado})"


class SaldoCuentaMensual(models.Model):
    cuenta = models.ForeignKey(Cuenta, on_delete=models.PROTECT)

    anio = models.IntegerField()
    mes = models.IntegerField()

    saldo_final = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        unique_together = ("cuenta", "anio", "mes")

    def __str__(self):
        return f"{self.cuenta} {self.anio}-{self.mes:02d} = {self.saldo_final}"


class TipoCambio(models.Model):

    fecha = models.DateField(unique=True)

    usd_uyu = models.DecimalField(
        max_digits=10,
        decimal_places=4
    )

    def __str__(self):
        return f"{self.fecha} - {self.usd_uyu}"
    