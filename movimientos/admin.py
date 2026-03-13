
from django.contrib import admin
from .models import Movimiento
from rubros.models import MovimientoRubro


class MovimientoRubroInline(admin.TabularInline):
    model = MovimientoRubro
    extra = 3


class MovimientoAdmin(admin.ModelAdmin):
    inlines = [MovimientoRubroInline]


admin.site.register(Movimiento, MovimientoAdmin)