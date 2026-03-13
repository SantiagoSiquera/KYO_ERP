
from django.contrib import admin
from .models import TipoCambio, PeriodoContable, SaldoCuentaMensual

admin.site.register(TipoCambio)
admin.site.register(PeriodoContable)
admin.site.register(SaldoCuentaMensual)