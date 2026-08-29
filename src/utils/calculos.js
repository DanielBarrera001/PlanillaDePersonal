// 1. CÁLCULO DE AGUINALDO (Con opción de Renta y Adelantos)
export function calcularAguinaldo(salarioMensual, fechaIngreso, adelantos = 0, aplicaRenta = false, tasaRenta = 0, fechaCalculo = new Date()) {
  const ingreso = new Date(fechaIngreso);
  const calculo = new Date(fechaCalculo);
  
  const diffTiempo = Math.abs(calculo - ingreso);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  const anosAntiguedad = Math.floor(diasTrabajados / 365);
  
  const salarioDiario = salarioMensual / 30;
  let diasCorresponden = 0;
  let montoBruto = 0;

  if (anosAntiguedad < 1) {
    montoBruto = ((salarioDiario * 15) / 365) * diasTrabajados;
    diasCorresponden = Number(((15 / 365) * diasTrabajados).toFixed(2));
  } else if (anosAntiguedad >= 1 && anosAntiguedad < 3) {
    diasCorresponden = 15;
    montoBruto = salarioDiario * 15;
  } else if (anosAntiguedad >= 3 && anosAntiguedad < 10) {
    diasCorresponden = 19;
    montoBruto = salarioDiario * 19;
  } else {
    diasCorresponden = 21;
    montoBruto = salarioDiario * 21;
  }

  const descuentoRenta = aplicaRenta ? montoBruto * (tasaRenta / 100) : 0;
  const montoNeto = montoBruto - descuentoRenta - adelantos;

  return {
    diasCorresponden,
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoRenta: Number(descuentoRenta.toFixed(2)),
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2)),
    anosAntiguedad,
    diasTrabajados
  };
}

// 2. CÁLCULO DE VACACIONES (Con Bono y Adelantos)
export function calcularVacaciones(salarioMensual, porcentajeBono = 30, adelantos = 0) {
  const salarioQuincenal = salarioMensual / 2; // 15 días de salario
  const montoBono = salarioQuincenal * (porcentajeBono / 100);
  const montoBruto = salarioQuincenal + montoBono;
  const montoNeto = montoBruto - adelantos;

  return {
    salario15Dias: Number(salarioQuincenal.toFixed(2)),
    montoBono: Number(montoBono.toFixed(2)),
    montoBruto: Number(montoBruto.toFixed(2)),
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2))
  };
}

// 3. CÁLCULO DE QUINCENA 25 (Con Adelantos)
export function calcularQuincena25(salarioMensual, fechaIngreso, adelantos = 0) {
  // Monto base de una quincena (15 días)
  let montoBruto = salarioMensual / 2; 

  // ISSS (3%) - Calculado sobre el techo máximo de $1000 al mes ($500 por quincena)
  const baseISSS = Math.min(montoBruto, 500);
  const descuentoISSS = baseISSS * 0.03;

  // AFP (7.25%) - Calculado sobre el monto bruto total
  const descuentoAFP = montoBruto * 0.0725;

  const montoNeto = montoBruto - descuentoISSS - descuentoAFP - adelantos;

  return {
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: Number(descuentoISSS.toFixed(2)),
    descuentoAFP: Number(descuentoAFP.toFixed(2)),
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2)),
  };
}