from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from django.db import transaction
from datetime import date
from django.utils.formats import date_format

from .models import Movimiento
from cuentas.models import Cuenta
from .forms import MovimientoForm
from rubros.models import Rubro, MovimientoRubro
from proveedores.models import Proveedor
from django.http import JsonResponse

from utils.dinero import normalizar_numero, sumar, son_iguales


@login_required
def crear_movimiento(request):

    cuenta_id = request.GET.get("cuenta") or request.POST.get("cuenta")
    cuenta = get_object_or_404(Cuenta, id=cuenta_id)

    rubros = Rubro.objects.all().order_by("nombre")
    proveedores = Proveedor.objects.all().order_by("nombre")

    if request.method == "POST":

        data = request.POST.copy()

        # normalizar monto movimiento
        if "monto" in data and data["monto"]:
            data["monto"] = format(normalizar_numero(data["monto"]), ".2f")

        form = MovimientoForm(data)

        if form.is_valid():

            rubros_ids = data.getlist("rubro[]")
            proveedores_ids = data.getlist("proveedor[]")
            importes = data.getlist("importe[]")

            # convertir valores monetarios usando utilidades
            monto_movimiento = normalizar_numero(data["monto"])

            # -------------------------------
            # AQUI SE APLICA EL SIGNO
            # -------------------------------

            tipo = data.get("tipo_movimiento")

            if tipo == "egreso":
                monto_movimiento = -abs(monto_movimiento)
            else:
                monto_movimiento = abs(monto_movimiento)

            total_rubros = sumar(importes)

            if not son_iguales(abs(monto_movimiento), total_rubros):

                return JsonResponse({
                    "ok": False,
                    "error": "La suma de rubros no coincide con el movimiento",
                    "monto_movimiento": float(monto_movimiento),
                    "total_rubros": float(total_rubros)
                }, status=400)

            with transaction.atomic():

                movimiento = form.save(commit=False)
                movimiento.cuenta = cuenta
                movimiento.monto = monto_movimiento
                movimiento.save()

                for i in range(len(rubros_ids)):

                    rubro_id = rubros_ids[i].strip()
                    proveedor_id = proveedores_ids[i].strip() if i < len(proveedores_ids) else ""
                    importe = importes[i].strip() if i < len(importes) else ""

                    if not rubro_id or not importe:
                        continue

                    rubro = get_object_or_404(Rubro, id=rubro_id)

                    proveedor = None
                    if proveedor_id:
                        proveedor = get_object_or_404(Proveedor, id=proveedor_id)

                    importe = normalizar_numero(importe)

                    MovimientoRubro.objects.create(
                        movimiento=movimiento,
                        rubro=rubro,
                        proveedor=proveedor,
                        monto=importe
                    )

            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return JsonResponse({
                    "ok": True,
                    "movimiento": {
                        "id": movimiento.id,
                        "fecha": movimiento.fecha.strftime("%d/%m/%Y"),
                        "cuenta": str(movimiento.cuenta),
                        "descripcion": movimiento.descripcion,
                        "monto": float(movimiento.monto),
                        "estado": movimiento.estado,
                    }
                })

            return redirect(f"/movimientos/conciliacion?cuenta={movimiento.cuenta.id}")

        else:
            print("ERROR FORMULARIO:")
            print(form.errors)

            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return JsonResponse({
                    "ok": False,
                    "errors": form.errors,
                }, status=400)

    else:
        form = MovimientoForm(initial={"cuenta": cuenta})

    return render(
        request,
        "movimientos/form_movimiento_modal.html",
        {
            "form": form,
            "cuenta": cuenta,
            "rubros": rubros,
            "proveedores": proveedores,
        },
    )

@login_required
def conciliacion(request):

    cuenta_id = request.GET.get("cuenta")

    mes = int(request.GET.get("mes", date.today().month))
    anio = int(request.GET.get("anio", date.today().year))

    cuenta = None

    movimientos = Movimiento.objects.select_related("cuenta")

    if cuenta_id:
        cuenta = Cuenta.objects.get(id=cuenta_id)
        movimientos = movimientos.filter(cuenta_id=cuenta_id)

    movimientos_mes = movimientos.filter(
        fecha__year=anio,
        fecha__month=mes
    ).order_by("-fecha")

    ingresos = movimientos_mes.filter(monto__gt=0).aggregate(
        total=Sum("monto")
    )["total"] or 0

    egresos = movimientos_mes.filter(monto__lt=0).aggregate(
        total=Sum("monto")
    )["total"] or 0

    saldo_actual = ingresos + egresos

    mes_nombre = date_format(date(anio, mes, 1), "F")

    return render(
        request,
        "banco/conciliacion.html",
        {
            "movimientos": movimientos_mes,
            "cuenta": cuenta,
            "mes": mes,
            "anio": anio,
            "mes_nombre": mes_nombre,
            "ingresos": ingresos,
            "egresos": egresos,
            "saldo_actual": saldo_actual,
            "saldo_inicial": 0,
        },
    )


@login_required
def cambiar_estado(request, id):

    movimiento = get_object_or_404(Movimiento, id=id)

    if request.method == "POST":
        movimiento.estado = request.POST["estado"]
        movimiento.save()

    return redirect(f"/conciliacion?cuenta={movimiento.cuenta.id}")