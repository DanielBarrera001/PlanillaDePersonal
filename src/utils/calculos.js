// 1. CÁLCULO DE AGUINALDO (Liquidación Anual)
export function calcularAguinaldo(salarioMensual, fechaIngreso, adelantos = 0, aplicaRenta = false, tasaRenta = 0, fechaCalculo = new Date()) {
  if (!fechaIngreso) return { diasCorresponden: 0, montoBruto: 0, montoNeto: 0, descuentoRenta: 0, adelantos: Number(adelantos) };

  const calculo = new Date(fechaCalculo);
  const anioCalculo = calculo.getFullYear();
  
  // Fijamos el tope máximo de antigüedad al 1 de enero del año actual
  const inicioAnio = new Date(`${anioCalculo}-01-01T00:00:00`);
  const ingresoOriginal = new Date(fechaIngreso + 'T00:00:00');
  
  // Toma la fecha más reciente: o el 1 de enero, o cuando entró a laborar este año
  const fechaInicio = ingresoOriginal > inicioAnio ? ingresoOriginal : inicioAnio;
  
  const diffTiempo = Math.abs(calculo - fechaInicio);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  
  const salarioDiario = salarioMensual / 30;
  
  // Al liquidarse cada año, siempre es el proporcional a los 15 días básicos de ley
  const montoBruto = ((salarioDiario * 15) / 365) * diasTrabajados;
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
    anosAntiguedad: 0, // Se anula la acumulación de años por política de la empresa
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
    descuentoISSS: 0,
    descuentoAFP: 0,
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2))
  };
}

// 3. CÁLCULO DE QUINCENA 25 (Con Adelantos - Sin retenciones de ISSS/AFP individuales)
export function calcularQuincena25(salarioMensual, fechaIngreso, adelantos = 0) {
  // Monto base de una quincena (15 días) sin retenciones de ley fraccionadas
  let montoBruto = salarioMensual / 2; 

  const montoNeto = montoBruto - adelantos;

  return {
    montoBruto: Number(montoBruto.toFixed(2)),
    descuentoISSS: 0, // No aplica en pago quincenal aislado
    descuentoAFP: 0,  // No aplica en pago quincenal aislado
    descuentoRenta: 0,
    adelantos: Number(adelantos),
    montoNeto: Number(montoNeto.toFixed(2)),
  };
}

// Calculo de vacaciones en dias
export function calcularDiasAnualidad(fechaIngreso, diasTomadosEstePeriodo = 0) {
  if (!fechaIngreso) return { diasTotales: 15, diasDisponibles: 15, periodoTexto: '' };

  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  
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

// 5. CÁLCULO DE INDEMNIZACIÓN (Liquidación Anual)
export function calcularIndemnizacion(salarioMensual, fechaIngreso, fechaRetiro = new Date(), adelantos = 0) {
  if (!fechaIngreso) {
    return { diasCorresponden: 0, anosServicio: 0, montoBruto: 0, descuentoISSS: 0, descuentoAFP: 0, descuentoRenta: 0, adelantos: Number(adelantos), montoNeto: 0 };
  }

  const retiro = new Date(fechaRetiro);
  const anioRetiro = retiro.getFullYear();
  
  // Fijamos el tope máximo al 1 de enero del año del retiro
  const inicioAnio = new Date(`${anioRetiro}-01-01T00:00:00`);
  const ingresoOriginal = new Date(fechaIngreso + 'T00:00:00');
  
  const fechaInicio = ingresoOriginal > inicioAnio ? ingresoOriginal : inicioAnio;
  
  const diffTiempo = Math.abs(retiro - fechaInicio);
  const diasTrabajados = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
  const proporcionAnio = diasTrabajados / 365;
  
  // Indemnización proporcional a los meses/días laborados únicamente en el año actual
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