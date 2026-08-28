// 1. CÁLCULO DE AGUINALDO
export function calcularAguinaldo(salarioMensual, fechaIngreso, fechaCalculo = new Date()) {
  const ingreso = new Date(fechaIngreso);
  const calculo = new Date(fechaCalculo);
  
  // Diferencia de tiempo
  const diffTiempo = Math.abs(calculo - ingreso);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  const anosAntiguedad = Math.floor(diasTrabajados / 365);
  
  const salarioDiario = salarioMensual / 30;
  let diasCorresponden = 0;
  let monto = 0;

  if (anosAntiguedad < 1) {
    // Proporcional: (Salario diario * 15 días / 365) * días trabajados
    monto = ((salarioDiario * 15) / 365) * diasTrabajados;
    diasCorresponden = Number(((15 / 365) * diasTrabajados).toFixed(2));
  } else if (anosAntiguedad >= 1 && anosAntiguedad < 3) {
    diasCorresponden = 15;
    monto = salarioDiario * 15;
  } else if (anosAntiguedad >= 3 && anosAntiguedad < 10) {
    diasCorresponden = 19;
    monto = salarioDiario * 19;
  } else {
    diasCorresponden = 21;
    monto = salarioDiario * 21;
  }

  return {
    diasCorresponden,
    monto: Number(monto.toFixed(2)),
    anosAntiguedad,
    diasTrabajados
  };
}

// 2. CÁLCULO DE VACACIONES
export function calcularVacaciones(salarioMensual, porcentajeBono = 30) {
  const salarioQuincenal = salarioMensual / 2; // 15 días de salario
  const montoBono = salarioQuincenal * (porcentajeBono / 100);
  const totalPagar = salarioQuincenal + montoBono;

  return {
    salario15Dias: Number(salarioQuincenal.toFixed(2)),
    montoBono: Number(montoBono.toFixed(2)),
    totalPagar: Number(totalPagar.toFixed(2))
  };
}

// 3. CÁLCULO DE QUINCENA 25
export function calcularQuincena25(salarioMensual, fechaIngreso) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diasTrabajados = Math.floor((hoy - ingreso) / (1000 * 60 * 60 * 24));
  const anosAntiguedad = diasTrabajados / 365;

  let montoBase = salarioMensual * 0.5; // 50% del salario mensual

  if (anosAntiguedad < 1) {
    montoBase = (montoBase / 365) * diasTrabajados;
  }

  return {
    monto: Number(montoBase.toFixed(2)),
    exentoImpuestos: salarioMensual <= 1500
  };
}