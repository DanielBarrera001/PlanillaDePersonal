import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { calcularAguinaldo, calcularVacaciones, calcularQuincena25, calcularIndemnizacion } from '../utils/calculos';
import { numeroALetras } from '../utils/numeroALetras';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { Calculator, Receipt, CreditCard, Users, Calendar, Award, DollarSign } from 'lucide-react';

export const FormularioPagos = ({ empleados = [] }) => {
  const [totalCreditosPendientes, setTotalCreditosPendientes] = useState(0);
  const [clientesConDeuda, setClientesConDeuda] = useState(0);
  const [vacacionesTotalesUsadas, setVacacionesTotalesUsadas] = useState(0);
  const [empleadosConVacaciones, setEmpleadosConVacaciones] = useState([]);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [tipoPago, setTipoPago] = useState('quincena');
  const [adelantoAutomatico, setAdelantoAutomatico] = useState(0);
  const [montoHonorario, setMontoHonorario] = useState(0);
  const [pagoCalculado, setPagoCalculado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarMetricasResumen();
  }, [empleados]);

  useEffect(() => {
    if (empleadoSeleccionado) {
      cargarAdelantoEmpleado(empleadoSeleccionado);
    } else {
      setAdelantoAutomatico(0);
    }
  }, [empleadoSeleccionado]);

  const cargarMetricasResumen = async () => {
    const empConVac = await Promise.all(
      empleados.map(async (emp) => {
        if (emp.tipo_empleado === 'honorarios') return { ...emp, diasTomados: 0, diasDisponibles: 15 };
        
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

  const cargarAdelantoEmpleado = async (empId) => {
    const { data, error } = await supabase
      .from('pagos_registro')
      .select('adelanto_salario, observaciones')
      .eq('empleado_id', empId)
      .eq('monto_bruto', 0)
      .gt('adelanto_salario', 0);

    if (!error && data) {
      const pendientes = data.filter(item => !item.observaciones || !item.observaciones.includes('Saldado'));
      const totalAdelantos = pendientes.reduce((acc, curr) => acc + Number(curr.adelanto_salario || 0), 0);
      setAdelantoAutomatico(totalAdelantos);
    } else {
      setAdelantoAutomatico(0);
    }
  };

  const empleado = empleados.find((e) => String(e.id) === String(empleadoSeleccionado));

  const handleCalcular = () => {
    if (!empleado) {
      alert('Selecciona un empleado de la lista para continuar.');
      return;
    }

    let resultado = {};
    const adelantoNum = parseFloat(adelantoAutomatico) || 0;
    const salarioBaseNum = parseFloat(empleado.salario_base) || 0;
    const esHonorarios = empleado.tipo_empleado === 'honorarios';

    
    if (tipoPago === 'honorarios') {
      const montoNum = parseFloat(montoHonorario) || salarioBaseNum;
      if (montoNum <= 0) {
        alert('Ingresa un monto válido para los honorarios.');
        return;
      }

      if (adelantoNum > montoNum) {
        setPagoCalculado(null);
        alert(`ERROR: El adelanto pendiente ($${adelantoNum.toFixed(2)}) no puede ser mayor al monto a facturar ($${montoNum.toFixed(2)}).`);
        return;
      }

      resultado = {
        tipo_pago: 'honorarios',
        monto_bruto: montoNum,
        descuento_isss: 0,
        descuento_afp: 0,
        descuento_renta: 0,
        adelanto_salario: adelantoNum,
        monto_neto: montoNum - adelantoNum,
        monto_letras: numeroALetras(montoNum - adelantoNum),
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
        const montoBrutoQuincena = salarioBaseNum / 2;
        const descuentoISSS = esHonorarios ? 0 : Math.min(montoBrutoQuincena, 500) * 0.03;
        const descuentoAFP = esHonorarios ? 0 : montoBrutoQuincena * 0.0725;
        
        resCalc = {
          montoBruto: montoBrutoQuincena,
          descuentoISSS,
          descuentoAFP,
          descuentoRenta: 0,
          montoNeto: montoBrutoQuincena - descuentoISSS - descuentoAFP
        };
      }

      const bruto = Number(resCalc.montoBruto || resCalc.salario15Dias || resCalc.montoVacaciones || 0);
      const bono = Number(resCalc.montoBono || 0);
      const finalISSS = esHonorarios ? 0 : Number(resCalc.descuentoISSS || 0);
      const finalAFP = esHonorarios ? 0 : Number(resCalc.descuentoAFP || 0);
      const finalRenta = esHonorarios ? 0 : Number(resCalc.descuentoRenta || 0);
      
      let disponible = resCalc.montoNeto !== undefined 
        ? Number(resCalc.montoNeto) 
        : ((bruto + bono) - finalISSS - finalAFP - finalRenta);

      if (adelantoNum > disponible) {
        setPagoCalculado(null);
        alert(`ERROR: El adelanto pendiente ($${adelantoNum.toFixed(2)}) es mayor al dinero disponible de este recibo ($${disponible.toFixed(2)}). No se puede procesar.`);
        return;
      }

      const netoCalculado = disponible - adelantoNum;

      resultado = {
        tipo_pago: tipoPago,
        fecha_pago: new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
        monto_bruto: bruto > 0 ? bruto : disponible,
        monto_bono_vacaciones: bono,
        descuento_isss: finalISSS,
        descuento_afp: finalAFP,
        descuento_renta: finalRenta,
        adelanto_salario: adelantoNum,
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
      descuento_isss: pagoCalculado.descuento_isss || 0,
      descuento_afp: pagoCalculado.descuento_afp || 0,
      descuento_renta: pagoCalculado.descuento_renta || 0,
      adelanto_salario: pagoCalculado.adelanto_salario || 0,
      monto_neto: pagoCalculado.monto_neto,
      fecha_pago: pagoCalculado.fecha_pago || new Date().toISOString().split('T')[0],
      observaciones: `Pago de ${tipoPago} con descuento de adelanto aplicado.`
    }]);

    if (error) {
      setGuardando(false);
      alert('Error al guardar el pago: ' + error.message);
      return;
    }

    if (pagoCalculado.adelanto_salario > 0) {
      const { error: errorActualizar } = await supabase
        .from('pagos_registro')
        .update({ observaciones: 'Saldado en planilla' })
        .eq('empleado_id', empleado.id)
        .eq('monto_bruto', 0)
        .gt('adelanto_salario', 0);

      if (errorActualizar) {
        console.error('Error al actualizar los adelantos:', errorActualizar.message);
      }
    }

    setGuardando(false);
    alert('¡Pago registrado con éxito y adelantos saldados!');
    
    setPagoCalculado(null);
    setAdelantoAutomatico(0);
    cargarMetricasResumen();
  };

  const empleadosPlanilla = empleadosConVacaciones.filter(e => e.tipo_empleado === 'planilla');

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Créditos Pendientes</p>
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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          Estatus de Vacaciones del Personal (Ley 15 Días)
        </h3>
        {empleadosPlanilla.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {empleadosPlanilla.map((emp) => {
              const porcentaje = Math.min(100, (emp.diasTomados / 15) * 100);
              return (
                <div key={emp.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                    <span>{emp.nombre_completo}</span>
                    <span className="text-emerald-700">{emp.diasDisponibles} días libres</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No hay personal de planilla registrado.</p>
        )}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Procesamiento de Planilla
          </h2>
          <p className="text-slate-500 text-sm">Completa los datos para generar y registrar un nuevo recibo.</p>
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
                  <option value="indemnizacion">Indemización</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adelantos Pendientes</label>
                <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold flex items-center justify-between">
                  <span>${adelantoAutomatico.toFixed(2)}</span>
                  <span className="text-xs font-normal text-slate-400">(Vinculado de créditos)</span>
                </div>
              </div>
            </div>

            {tipoPago === 'honorarios' && (
              <div>
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

                    <div className="flex justify-between text-sm text-rose-600">
                      <span>Descuento por Adelantos:</span>
                      <span>-${Number(pagoCalculado.adelanto_salario || 0).toFixed(2)}</span>
                    </div>
                    
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