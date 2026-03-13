from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from cuentas.models import Cuenta


@login_required
def dashboard(request):

    return render(request, "core/dashboard.html")


@login_required
def banco_dashboard(request):

    cuentas = Cuenta.objects.filter(activa=True)

    return render(
        request,
        "banco/dashboard_banco.html",
        {
            "cuentas": cuentas
        }
    )


def login_view(request):

    if request.method == "POST":

        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(request, username=username, password=password)

        if user is not None:

            login(request, user)
            return redirect("/")

    return render(request, "core/login.html")


def logout_view(request):

    logout(request)

    return redirect("/login/")