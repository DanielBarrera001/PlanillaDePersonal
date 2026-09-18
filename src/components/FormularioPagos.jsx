import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calcularAguinaldo, calcularVacaciones, calcularQuincena25, calcularIndemnizacion } from '../utils/calculos';
import { numeroALetras } from '../utils/numeroALetras';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { Calculator, Receipt, CreditCard, Users, Calendar, Award, DollarSign, Clock } from 'lucide-react';

export const FormularioPagos = ({ empleados = [] }) => {
  const [totalCreditosPendientes, setTotalCreditosPendientes] = useState(0);
  const [clientesConDeuda, setClientesConDeuda] = useState(0);
  const [vacacionesTotalesUsadas, setVacacionesTotalesUsadas] = useState(0);
  const [empleadosConVacaciones, setEmpleadosConVacaciones] = useState([]);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [tipoPago, setTipoPago] = useState('quincena');
  const [periodoQuincena, setPeriodoQuincena] = useState('1'); // '1' para primera quincena, '2' para segunda
  
  // 1. ADELANTO (Descuento Único y Obligatorio)
  const [adelantoPendiente, setAdelantoPendiente] = useState(0);

  // 2. CRÉDITO DE INVERSIÓN (Abono Flexible/Variable digitado por ti)
  const [saldoCreditoInversion, setSaldoCreditoInversion] = useState(0);
  const [abonoCreditoFlex, setAbonoCreditoFlex] = useState(''); 

  // 3. HORAS EXTRAS (Monto manual dictado por el jefe)
  const [montoHorasExtras, setMontoHorasExtras] = useState('');

  const [montoHonorario, setMontoHonorario] = useState(0);
  const [pagoCalculado, setPagoCalculado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  
  useEffect(() => {
    cargarMetricasResumen();
  }, [empleados]);

  useEffect(() => {
    if (empleadoSeleccionado) {
      cargarDeudasEmpleado(empleadoSeleccionado);
    } else {
      setAdelantoPendiente(0);
      setSaldoCreditoInversion(0);
      setAbonoCreditoFlex('');
      setMontoHorasExtras('');
    }
  }, [empleadoSeleccionado]);

  const cargarMetricasResumen = async () => {
    const empConVac = await Promise.all(
      empleados.map(async (emp) => {
        const { data: vacReg } = await supabase
          .from('vacaciones_registros')
          .select('dias_tomados')
          .eq('empleado_id', emp.id);

        const tomados = (vacReg || []).reduce((acc, curr) => acc + Number(curr.dias_tomados || 0), 0);
        return { ...emp, diasTomados: tomados, diasDisponibles: Math.max(0, 15 - tomados) };
      })
    );
    setEmpleadosConVacaciones(empConVac);

    const sumaVac = empConVac.reduce((acc, curr) => acc + (curr.diasTomados || 0), 0);
    setVacacionesTotalesUsadas(sumaVac);

    const { data: cuentas } = await supabase.from('creditos_cuentas').select('*, creditos_abonos(*)');
    if (cuentas) {
      let pendienteTotal = 0;
      let clientesDeudaSet = new Set();

      cuentas.forEach(cuenta => {
        if (cuenta.estado !== 'pagado') {
          const abonado = (cuenta.creditos_abonos || []).reduce((a, c) => a + Number(c.monto_abono || 0), 0);
          const saldo = Math.max(0, Number(cuenta.monto_total) - abonado);
          if (saldo > 0) {
            pendienteTotal += saldo;
            clientesDeudaSet.add(cuenta.cliente_id);
          }
        }
      });

      setTotalCreditosPendientes(pendienteTotal);
      setClientesConDeuda(clientesDeudaSet.size);
    }
  };

  const cargarDeudasEmpleado = async (empId) => {
    const { data: adelantosData } = await supabase
      .from('pagos_registro')
      .select('adelanto_salario, observaciones')
      .eq('empleado_id', empId)
      .eq('monto_bruto', 0)
      .gt('adelanto_salario', 0);

    if (adelantosData) {
      const pendientes = adelantosData.filter(item => !item.observaciones || !item.observaciones.includes('Saldado'));
      const totalAdelantos = pendientes.reduce((acc, curr) => acc + Number(curr.adelanto_salario || 0), 0);
      setAdelantoPendiente(totalAdelantos);
    } else {
      setAdelantoPendiente(0);
    }

    const { data: creditosData } = await supabase
      .from('pagos_registro')
      .select('credito_otorgado, descuento_credito')
      .eq('empleado_id', empId);

    if (creditosData) {
      const otorgados = creditosData.reduce((acc, curr) => acc + Number(curr.credito_otorgado || 0), 0);
      const abonados = creditosData.reduce((acc, curr) => acc + Number(curr.descuento_credito || 0), 0);
      const saldoActual = Math.max(0, otorgados - abonados);
      setSaldoCreditoInversion(saldoActual);
      setAbonoCreditoFlex('');
    } else {
      setSaldoCreditoInversion(0);
      setAbonoCreditoFlex('');
    }
  };

  const empleado = empleados.find((e) => String(e.id) === String(empleadoSeleccionado));

  const handleCalcular = () => {
    if (!empleado) {
      alert('Selecciona un empleado de la lista para continuar.');
      return;
    }

    let resultado = {};
    const adelantoNum = parseFloat(adelantoPendiente) || 0; 
    const abonoFlexNum = parseFloat(abonoCreditoFlex) || 0;  
    const horasExtrasNum = parseFloat(montoHorasExtras) || 0;
    const salarioBaseNum = parseFloat(empleado.salario_base) || 0;
    const esHonorarios = empleado.tipo_empleado === 'honorarios';

    if (abonoFlexNum > saldoCreditoInversion) {
      setPagoCalculado(null);
      alert(`ERROR: El abono al crédito ($${abonoFlexNum.toFixed(2)}) supera el saldo pendiente ($${saldoCreditoInversion.toFixed(2)}).`);
      return;
    }

    if (tipoPago === 'honorarios') {
      const montoNum = (parseFloat(montoHonorario) || salarioBaseNum) + horasExtrasNum;
      if (montoNum <= 0) {
        alert('Ingresa un monto válido para los honorarios.');
        return;
      }

      const totalDescuentos = adelantoNum + abonoFlexNum;
      if (totalDescuentos > montoNum) {
        setPagoCalculado(null);
        alert(`ERROR: Los descuentos totales ($${totalDescuentos.toFixed(2)}) superan el monto a facturar ($${montoNum.toFixed(2)}).`);
        return;
      }

      resultado = {
        tipo_pago: 'honorarios',
        monto_bruto: (parseFloat(montoHonorario) || salarioBaseNum),
        horas_extras: horasExtrasNum,
        descuento_isss: 0,
        descuento_afp: 0,
        descuento_renta: 0,
        adelanto_salario: adelantoNum,    
        descuento_credito: abonoFlexNum, 
        monto_neto: montoNum - totalDescuentos,
        monto_letras: numeroALetras(montoNum - totalDescuentos),
      };
    } else {
      let resCalc = {};
      
      if (tipoPago === 'aguinaldo') {
        resCalc = calcularAguinaldo(salarioBaseNum, empleado.fecha_ingreso, 0);
      } else if (tipoPago === 'vacaciones') {
        resCalc = calcularVacaciones(salarioBaseNum, 30, 0);
      } else if (tipoPago === 'quincena_25') {
        resCalc = calcularQuincena25(salarioBaseNum, empleado.fecha_ingreso, 0);
      } else if (tipoPago === 'indemnizacion') {
        resCalc = calcularIndemnizacion(salarioBaseNum, empleado.fecha_ingreso);
      } else if (tipoPago === 'quincena') {
        const fechaIngresoEmp = new Date(empleado.fecha_ingreso + 'T00:00:00');
        const hoy = new Date();
        const anioActual = hoy.getFullYear();
        const mesActual = hoy.getMonth();
        
        let inicioDePeriodo;
        let finDePeriodo;
        
        if (periodoQuincena === '1') {
          inicioDePeriodo = new Date(anioActual, mesActual, 1);
          finDePeriodo = new Date(anioActual, mesActual, 15);
        } else {
          inicioDePeriodo = new Date(anioActual, mesActual, 16);
          finDePeriodo = new Date(anioActual, mesActual + 1, 0);
        }

        const fechaInicioEfectiva = fechaIngresoEmp > inicioDePeriodo ? fechaIngresoEmp : inicioDePeriodo;
        
        let diasCalculadosPeriodo = 0;
        if (fechaInicioEfectiva <= finDePeriodo) {
          const diffTiempo = finDePeriodo - fechaInicioEfectiva;
          diasCalculadosPeriodo = Math.floor(diffTiempo / (1000 * 60 * 60 * 24)) + 1;
        }
        
        const diasAjustados = Math.max(0, Math.min(15, diasCalculadosPeriodo));
        
        const salarioDiario = salarioBaseNum / 30;
        const montoBrutoQuincena = salarioDiario * diasAjustados;
        
        const descuentoISSS = esHonorarios ? 0 : Math.min(montoBrutoQuincena, 500) * 0.03;
        const descuentoAFP = esHonorarios ? 0 : montoBrutoQuincena * 0.0725;
        
        resCalc = {
          montoBruto: montoBrutoQuincena,
          descuentoISSS,
          descuentoAFP,
          descuentoRenta: 0,
          montoNeto: montoBrutoQuincena - descuentoISSS - descuentoAFP,
          diasCorresponden: diasAjustados
        };
      }

      const bruto = Number(resCalc.montoBruto || resCalc.salario15Dias || resCalc.montoVacaciones || 0);
      const bono = Number(resCalc.montoBono || 0);
      const finalISSS = esHonorarios ? 0 : Number(resCalc.descuentoISSS || 0);
      const finalAFP = esHonorarios ? 0 : Number(resCalc.descuentoAFP || 0);
      const finalRenta = esHonorarios ? 0 : Number(resCalc.descuentoRenta || 0);
      
      let disponible = (resCalc.montoNeto !== undefined ? Number(resCalc.montoNeto) : ((bruto + bono) - finalISSS - finalAFP - finalRenta)) + horasExtrasNum;

      const totalDescuentos = adelantoNum + abonoFlexNum;
      if (totalDescuentos > disponible) {
        setPagoCalculado(null);
        alert(`ERROR: Los descuentos totales ($${totalDescuentos.toFixed(2)}) superan el dinero disponible del recibo ($${disponible.toFixed(2)}).`);
        return;
      }

      const netoCalculado = disponible - totalDescuentos;

      resultado = {
        tipo_pago: tipoPago,
        fecha_pago: new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
        monto_bruto: bruto > 0 ? bruto : (disponible - horasExtrasNum),
        monto_bono_vacaciones: bono,
        horas_extras: horasExtrasNum,
        descuento_isss: finalISSS,
        descuento_afp: finalAFP,
        descuento_renta: finalRenta,
        adelanto_salario: adelantoNum,    
        descuento_credito: abonoFlexNum, 
        monto_neto: netoCalculado,
        dias_calculados: resCalc.diasCorresponden || 15,
        monto_letras: numeroALetras(netoCalculado),
      };
    }

    setPagoCalculado(resultado);
  };

  const handleGuardarEnSupabase = async () => {
    if (!pagoCalculado || !empleado) return;
    setGuardando(true);
    
    const { error } = await supabase.from('pagos_registro').insert([{
      empleado_id: empleado.id,
      empleado_nombre: empleado.nombre_completo,
      tipo_pago: tipoPago,
      monto_bruto: pagoCalculado.monto_bruto,
      monto_bono_vacaciones: pagoCalculado.monto_bono_vacaciones || 0,
      horas_extras: pagoCalculado.horas_extras || 0,
      descuento_isss: pagoCalculado.descuento_isss || 0,
      descuento_afp: pagoCalculado.descuento_afp || 0,
      descuento_renta: pagoCalculado.descuento_renta || 0,
      adelanto_salario: pagoCalculado.adelanto_salario || 0,      
      credito_otorgado: 0,
      descuento_credito: pagoCalculado.descuento_credito || 0,    
      monto_neto: pagoCalculado.monto_neto,
      fecha_pago: pagoCalculado.fecha_pago || new Date().toISOString().split('T')[0],
      observaciones: `Pago de ${tipoPago} ${pagoCalculado.horas_extras > 0 ? `(Incluye $${pagoCalculado.horas_extras} de horas extras)` : ''}`
    }]);

    if (error) {
      setGuardando(false);
      alert('Error al guardar el pago: ' + error.message);
      return;
    }

    if (pagoCalculado.adelanto_salario > 0) {
      await supabase
        .from('pagos_registro')
        .update({ observaciones: 'Saldado en planilla' })
        .eq('empleado_id', empleado.id)
        .eq('monto_bruto', 0)
        .gt('adelanto_salario', 0);
    }

    setGuardando(false);
    alert('¡Pago registrado con éxito!');
    
    setPagoCalculado(null);
    setAbonoCreditoFlex('');
    setMontoHorasExtras('');
    cargarMetricasResumen();
    cargarDeudasEmpleado(empleado.id);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Créditos Clientes</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">${totalCreditosPendientes.toFixed(2)}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">{clientesConDeuda} clientes con saldo</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Activo</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{empleados.length}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Colaboradores registrados</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vacaciones Usadas</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{vacacionesTotalesUsadas} días</h3>
            <p className="text-xs text-blue-600 font-medium mt-1">Acumulado del equipo</p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Procesamiento de Planilla
          </h2>
          <p className="text-slate-500 text-sm">Gestiona pagos, adelantos obligatorios, abonos y horas extras.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Colaborador</label>
              <select
                value={empleadoSeleccionado}
                onChange={(e) => {
                  setEmpleadoSeleccionado(e.target.value);
                  setPagoCalculado(null);
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- Selecciona un colaborador --</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_completo} ({emp.tipo_empleado === 'honorarios' ? 'Servicios' : 'Planilla'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Concepto de Pago</label>
                <select
                  value={tipoPago}
                  onChange={(e) => {
                    setTipoPago(e.target.value);
                    setPagoCalculado(null);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="quincena">Salario Quincenal / Ordinario</option>
                  <option value="quincena_25">Quincena 25</option>
                  <option value="aguinaldo">Aguinaldo</option>
                  <option value="vacaciones">Vacaciones</option>
                  <option value="indemnizacion">Indemnización</option>
                </select>
              </div>

              {/* Selector condicional del periodo de quincena */}
              {tipoPago === 'quincena' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Periodo de Quincena</label>
                  <select
                    value={periodoQuincena}
                    onChange={(e) => {
                      setPeriodoQuincena(e.target.value);
                      setPagoCalculado(null);
                    }}
                    className="w-full p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-emerald-800"
                  >
                    <option value="1">1ª Quincena (Días 1 al 15)</option>
                    <option value="2">2ª Quincena (Días 16 al Fin de Mes)</option>
                  </select>
                </div>
              )}

              <div className={tipoPago !== 'quincena' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adelanto Activo</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold flex items-center justify-between">
                  <span>${adelantoPendiente.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Abono a Crédito ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={abonoCreditoFlex}
                  onChange={(e) => setAbonoCreditoFlex(e.target.value)}
                  disabled={saldoCreditoInversion <= 0}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-slate-100"
                  placeholder="0.00"
                />
                {saldoCreditoInversion > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Deuda de crédito: <strong className="text-rose-600">${saldoCreditoInversion.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Horas Extras / Bono Extra ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={montoHorasExtras}
                  onChange={(e) => setMontoHorasExtras(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-500 mt-1">Monto ordenado por jefatura.</p>
              </div>

              {tipoPago === 'honorarios' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Monto Total Pactado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoHonorario}
                    onChange={(e) => setMontoHonorario(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ej. 150.00"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCalcular}
                disabled={!empleadoSeleccionado}
                className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition-all shadow-md"
              >
                Efectuar Cálculos
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            {pagoCalculado && empleado ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-emerald-800">
                    <Receipt className="w-5 h-5" />
                    <h3 className="text-lg font-bold">Desglose del Recibo</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Monto Bruto:</span>
                      <span className="font-semibold text-slate-800">${pagoCalculado.monto_bruto.toFixed(2)}</span>
                    </div>

                    {pagoCalculado.horas_extras > 0 && (
                      <div className="flex justify-between text-sm text-emerald-700 font-medium">
                        <span>Horas Extras:</span>
                        <span>+${pagoCalculado.horas_extras.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {pagoCalculado.descuento_isss > 0 && (
                      <div className="flex justify-between text-sm text-rose-600">
                        <span>Retención ISSS (3%):</span>
                        <span>-${pagoCalculado.descuento_isss.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {pagoCalculado.descuento_afp > 0 && (
                      <div className="flex justify-between text-sm text-rose-600">
                        <span>Retención AFP (7.25%):</span>
                        <span>-${pagoCalculado.descuento_afp.toFixed(2)}</span>
                      </div>
                    )}

                    {pagoCalculado.adelanto_salario > 0 && (
                      <div className="flex justify-between text-sm text-rose-600 font-medium">
                        <span>Descuento de Adelanto:</span>
                        <span>-${Number(pagoCalculado.adelanto_salario).toFixed(2)}</span>
                      </div>
                    )}

                    {pagoCalculado.descuento_credito > 0 && (
                      <div className="flex justify-between text-sm text-rose-600 font-medium">
                        <span>Abono a crédito:</span>
                        <span>-${Number(pagoCalculado.descuento_credito).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="pt-4 mt-2 border-t border-emerald-200">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-emerald-800">LÍQUIDO A PAGAR</span>
                        <span className="text-3xl font-extrabold text-emerald-600">
                          ${pagoCalculado.monto_neto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <BotonDescargaPDF
                    tipoRecibo={tipoPago}
                    empleado={empleado}
                    pago={pagoCalculado}
                    monto={pagoCalculado.monto_neto}
                    montoLetras={pagoCalculado.monto_letras}
                  />

                  <button
                    type="button"
                    onClick={handleGuardarEnSupabase}
                    disabled={guardando}
                    className="w-full py-3 bg-white border-2 border-emerald-600 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
                  >
                    {guardando ? 'Guardando en la nube...' : 'Guardar en el Historial'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50 min-h-[250px]">
                <Receipt className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium">El resumen del recibo aparecerá aquí</p>
                <p className="text-sm mt-1">Selecciona un empleado y efectúa el cálculo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};