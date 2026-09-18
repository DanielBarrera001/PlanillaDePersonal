// 1. CÁLCULO DE AGUINALDO (Proporcional al año en curso / Corte al 20 de diciembre)
export function calcularAguinaldo(salarioMensual, fechaIngreso, adelantos = 0, aplicaRenta = false, tasaRenta = 0, fechaCalculo = new Date()) {
  if (!fechaIngreso) return { diasCorresponden: 0, montoBruto: 0, montoNeto: 0, descuentoRenta: 0, adelantos: Number(adelantos) };

  const [anioIng, mesIng, diaIng] = fechaIngreso.split('-').map(Number);
  const ingresoOriginal = new Date(anioIng, mesIng - 1, diaIng);

  const calculo = new Date(fechaCalculo);
  const anioCalculo = calculo.getFullYear();
  
  // El aguinaldo se calcula dentro del año fiscal (del 1 de enero al 20 de diciembre)
  const inicioAnio = new Date(anioCalculo, 0, 1);
  const finAguinaldo = new Date(anioCalculo, 11, 20); // 20 de diciembre
  
  const fechaFinEfectiva = calculo > finAguinaldo ? finAguinaldo : calculo;
  const fechaInicio = ingresoOriginal > inicioAnio ? ingresoOriginal : inicioAnio;
  
  if (fechaInicio > fechaFinEfectiva) {
    return { diasCorresponden: 0, montoBruto: 0, descuentoISSS: 0, descuentoAFP: 0, descuentoRenta: 0, adelantos: Number(adelantos), montoNeto: 0, anosAntiguedad: 0, diasTrabajados: 0 };
  }

  const diffTiempo = Math.abs(fechaFinEfectiva - fechaInicio);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24)) + 1; // Incluyendo el día inicial
  
  const salarioDiario = salarioMensual / 30;
  
  // Proporción basada en los 15 días de ley correspondientes al tramo de 1 a 3 años
  const montoBruto = ((salarioDiario * 15) / 365) * Math.min(diasTrabajados, 365);
  const diasCorresponden = Number(((15 / 365) * diasTrabajados).toFixed(2));

  const descuentoRenta = aplicaRenta ? montoBruto * (tasaRenta / 100) : 0;
  const montoNeto = montoBruto - descuentoRenta - adelantos;

  return {
    diasCorresponden,
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: 0, 
    descuentoAFP: 0, 
    descuentoRenta: Number(descuentoRenta.toFixed(2)),
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2)),
    anosAntiguedad: 0,
    diasTrabajados
  };
}

// 2. CÁLCULO DE VACACIONES (Con Bono y Adelantos)
export function calcularVacaciones(salarioMensual, porcentajeBono = 30, adelantos = 0) {
  const salarioQuincenal = salarioMensual / 2;
  const montoBono = salarioQuincenal * (porcentajeBono / 100);
  const montoBruto = salarioQuincenal + montoBono;
  const montoNeto = montoBruto - adelantos;

  return {
    salario15Dias: Number(salarioQuincenal.toFixed(2)),
    montoBono: Number(montoBono.toFixed(2)),
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: 0,
    descuentoAFP: 0,
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2))
  };
}

// 3. CÁLCULO DE QUINCENA 25 (Proporcional al tiempo laborado conforme a reglas de aguinaldo)
export function calcularQuincena25(salarioMensual, fechaIngreso, adelantos = 0) {
  if (!fechaIngreso) {
    let montoBrutoBase = salarioMensual / 2;
    return { montoBruto: Number(montoBrutoBase.toFixed(2)), descuentoISSS: 0, descuentoAFP: 0, descuentoRenta: 0, adelantos: Number(adelantos), montoNeto: Number((montoBrutoBase - adelantos).toFixed(2)) };
  }

  const [anioIng, mesIng, diaIng] = fechaIngreso.split('-').map(Number);
  const ingresoOriginal = new Date(anioIng, mesIng - 1, diaIng);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  
  const inicioAnio = new Date(anioActual, 0, 1);
  const fechaInicio = ingresoOriginal > inicioAnio ? ingresoOriginal : inicioAnio;
  
  // Si trabajó el año completo o ingresó antes del año actual, le corresponde el 50% completo (la quincena entera)
  let montoBruto = salarioMensual / 2;

  if (ingresoOriginal > inicioAnio) {
    // Si ingresó en el transcurso del año (ej. en agosto), se calcula proporcional al tiempo laborado en el periodo
    const diffTiempo = Math.abs(hoy - fechaInicio);
    const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24)) + 1;
    const proporcion = Math.min(diasTrabajados / 365, 1);
    montoBruto = (salarioMensual / 2) * (proporcion * (365 / 365)); // Ajustado a la proporción del periodo
  }

  const montoNeto = montoBruto - adelantos;

  return {
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: 0,
    descuentoAFP: 0,
    descuentoRenta: 0,
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2)),
  };
}

// 4. Cálculo de vacaciones en días
export function calcularDiasAnualidad(fechaIngreso, diasTomadosEstePeriodo = 0) {
  if (!fechaIngreso) return { diasTotales: 15, diasDisponibles: 15, periodoTexto: '' };

  const [anioIng, mesIng, diaIng] = fechaIngreso.split('-').map(Number);
  const ingreso = new Date(anioIng, mesIng - 1, diaIng);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  
  const aniversarioEsteAno = new Date(ingreso);
  aniversarioEsteAno.setFullYear(anioActual);

  let inicioPeriodo = new Date(aniversarioEsteAno);
  if (hoy < aniversarioEsteAno) {
    inicioPeriodo.setFullYear(anioActual - 1);
  }
  
  const finPeriodo = new Date(inicioPeriodo);
  finPeriodo.setFullYear(inicioPeriodo.getFullYear() + 1);

  const diasTotales = 15;
  const diasDisponibles = Math.max(0, diasTotales - diasTomadosEstePeriodo);

  return {
    diasTotales,
    diasDisponibles,
    diasTomados: diasTomadosEstePeriodo,
    periodoTexto: `${inicioPeriodo.toLocaleDateString()} - ${finPeriodo.toLocaleDateString()}`
  };
}

// 5. CÁLCULO DE INDEMNIZACIÓN (Proporcional al ciclo actual)
export function calcularIndemnizacion(salarioMensual, fechaIngreso, fechaRetiro = new Date(), adelantos = 0) {
  if (!fechaIngreso) {
    return { diasCorresponden: 0, anosServicio: 0, montoBruto: 0, descuentoISSS: 0, descuentoAFP: 0, descuentoRenta: 0, adelantos: Number(adelantos), montoNeto: 0 };
  }

  const [anioIng, mesIng, diaIng] = fechaIngreso.split('-').map(Number);
  const ingresoOriginal = new Date(anioIng, mesIng - 1, diaIng);

  const retiro = new Date(fechaRetiro);
  const anioRetiro = retiro.getFullYear();
  
  const inicioAnio = new Date(anioRetiro, 0, 1);
  const fechaInicio = ingresoOriginal > inicioAnio ? ingresoOriginal : inicioAnio;
  
  const diffTiempo = Math.abs(retiro - fechaInicio);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  const proporcionAnio = diasTrabajados / 365;
  
  const montoBruto = salarioMensual * proporcionAnio;
  const montoNeto = montoBruto - adelantos;

  return {
    diasCorresponden: Number(diasTrabajados.toFixed(0)),
    anosServicio: Number(proporcionAnio.toFixed(2)),
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: 0,
    descuentoAFP: 0,
    descuentoRenta: 0,
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2))
  };
}