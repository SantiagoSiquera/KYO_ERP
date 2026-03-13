from decimal import Decimal, ROUND_HALF_UP


def normalizar_numero(valor):
    """
    Convierte número en formato latino o decimal a Decimal seguro.
    """

    if valor is None:
        return Decimal("0.00")

    valor = str(valor).strip()

    if valor == "":
        return Decimal("0.00")

    # formato latino
    if "," in valor:
        valor = valor.replace(".", "").replace(",", ".")
    else:
        valor = valor.replace(" ", "")

    try:
        numero = Decimal(valor).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )
    except:
        numero = Decimal("0.00")

    return numero


def sumar(valores):
    """
    Suma segura de montos monetarios
    """

    total = Decimal("0.00")

    for v in valores:
        total += normalizar_numero(v)

    return total


def son_iguales(a, b):
    """
    Comparación segura de dinero
    """

    a = normalizar_numero(a)
    b = normalizar_numero(b)

    return abs(a - b) < Decimal("0.01")