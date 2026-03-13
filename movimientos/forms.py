
from django import forms
from .models import Movimiento
from utils.dinero import normalizar_numero


class MovimientoForm(forms.ModelForm):

    class Meta:
        model = Movimiento
        fields = [
            "fecha",
            "cuenta",
            "descripcion",
            "moneda",
            "monto",
            "estado",
        ]

        widgets = {

            "fecha": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),

            "cuenta": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "descripcion": forms.TextInput(
                attrs={
                    "class": "form-control"
                }
            ),

            "moneda": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "monto": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "id": "montoMovimiento",
                    "placeholder": "0,00",
                    "autocomplete": "off"
                }
            ),

            "estado": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # estos campos los controla el sistema desde la conciliación
        self.fields["cuenta"].required = False
        self.fields["moneda"].required = False


        def clean_monto(self):

            valor = self.data.get("monto")

            if not valor:
                return valor

            try:
             return normalizar_numero(valor)
            except:
             raise forms.ValidationError("Monto inválido")