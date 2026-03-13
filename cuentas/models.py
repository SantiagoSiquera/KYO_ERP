from django.db import models

# Create your models here.
from django.db import models

class Cuenta(models.Model):

    TIPO_CUENTA = [
        ('BANCO', 'Banco'),
        ('CAJA', 'Caja'),
        ('FISCAL', 'Fiscal'),
    ]

    MONEDA = [
        ('USD', 'USD'),
        ('UYU', 'UYU'),
    ]

    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TIPO_CUENTA)
    moneda = models.CharField(max_length=3, choices=MONEDA)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.moneda})"