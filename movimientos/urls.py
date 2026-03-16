from django.urls import path
from . import views

urlpatterns = [
    path("conciliacion/", views.conciliacion, name="conciliacion"),
    path("cambiar-estado/<int:id>/", views.cambiar_estado, name="cambiar_estado"),
    path("nuevo/", views.crear_movimiento, name="crear_movimiento"),
]

path("resumen/", views.resumen_conciliacion, name="resumen_conciliacion"),