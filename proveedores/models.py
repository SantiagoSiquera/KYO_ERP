from django.db import models

# Create your models here.
from django.db import models


class Proveedor(models.Model):

    nombre = models.CharField(max_length=200)

    telefono = models.CharField(max_length=50, blank=True)

    email = models.EmailField(blank=True)

    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre