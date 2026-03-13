# Arquitectura del sistema KYO ERP

## Principio del sistema

El sistema financiero se basa en flujo de caja.

Cada movimiento bancario se divide en rubros.

La suma de rubros debe coincidir con el monto del movimiento.

## Estructura principal

Cuenta
  └ Movimiento
        └ MovimientoRubro

## Modelos clave

Cuenta
Movimiento
Rubro
MovimientoRubro
Proveedor
PeriodoContable
SaldoCuentaMensual

## Reglas del sistema

1. Un movimiento puede tener múltiples rubros.
2. La suma de los rubros debe coincidir con el monto del movimiento.
3. Algunos rubros requieren proveedor.
4. Los rubros determinan si el movimiento afecta resultado o no.

## Estados de movimiento

Pendiente
Acreditado

## Conciliación bancaria

La conciliación permite marcar movimientos que ya aparecen en el banco.

Visualmente se resaltan filas conciliadas.

## Conversión monetaria

El sistema trabaja con:

UYU
USD

Las conversiones se manejan en el módulo finanzas.