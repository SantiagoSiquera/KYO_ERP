from django.db.models import Sum
from django.utils import timezone

from movimientos.models import Movimiento
from cuentas.models import Cuenta
from .models import PeriodoContable, SaldoCuentaMensual


def cerrar_periodo(anio, mes):
    periodo = PeriodoContable.objects.get(anio=anio, mes=mes)

    if periodo.cerrado:
        raise Exception("El período ya está cerrado")

    for cuenta in Cuenta.objects.all():
        total = (
            Movimiento.objects
            .filter(
                cuenta=cuenta,
                fecha__year=anio,
                fecha__month=mes,
                estado="ACREDITADO"
            )
            .aggregate(total=Sum("monto"))["total"] or 0
        )

        SaldoCuentaMensual.objects.update_or_create(
            cuenta=cuenta,
            anio=anio,
            mes=mes,
            defaults={"saldo_final": total}
        )

    periodo.cerrado = True
    periodo.fecha_cierre = timezone.now()
    periodo.save()