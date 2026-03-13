from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Rubro, MovimientoRubro

admin.site.register(Rubro)
admin.site.register(MovimientoRubro)
