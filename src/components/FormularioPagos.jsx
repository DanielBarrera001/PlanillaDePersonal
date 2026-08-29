import React, { useState } from 'react';
import { calcularAguinaldo, calcularVacaciones, calcularQuincena25 } from '../utils/calculos';
import { numeroALetras } from '../utils/numeroALetras';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { supabase } from '../lib/supabaseClient';
import { Calculator, Receipt } from 'lucide-react';

export const FormularioPagos = ({ empleados = [] }) => {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [tipoPago, setTipoPago] = useState('quincena');
  const [adelanto, setAdelanto] = useState(0);
  const [montoHonorario, setMontoHonorario] = useState(0);
  const [pagoCalculado, setPagoCalculado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const empleado = empleados.find((e) => String(e.id) === String(empleadoSeleccionado));

  const handleCalcular = () => {
    if (!empleado) {
      alert('Selecciona un empleado de la lista para continuar.');
      return;
    }

    let resultado = {};
    const adelantoNum = parseFloat(adelanto) || 0;
    const salarioBaseNum = parseFloat(empleado.salario_base) || 0;

    if (tipoPago === 'honorarios') {
      const montoNum = parseFloat(montoHonorario) || 0;
      if (montoNum <= 0) {
        alert('Ingresa un monto válido para los honorarios.');
        return;
      }

      resultado = {
        tipo_pago: 'honorarios',
        monto_bruto: montoNum,
        monto_neto: montoNum - adelantoNum,
        adelanto_salario: adelantoNum,
        monto_letras: numeroALetras(montoNum - adelantoNum),
      };
    } else {
      let resCalc = {};
      if (tipoPago === 'aguinaldo') {
        resCalc = calcularAguinaldo(salarioBaseNum, empleado.fecha_ingreso, adelantoNum);
      } else if (tipoPago === 'vacaciones') {
        resCalc = calcularVacaciones(salarioBaseNum, 30, adelantoNum);
      } else if (tipoPago === 'quincena_25') {
        resCalc = calcularQuincena25(salarioBaseNum, empleado.fecha_ingreso, adelantoNum);
      } else if (tipoPago === 'quincena') {
        // Cálculo del Salario Quincenal Ordinario con deducciones de ley (ISSS y AFP)
        const montoBrutoQuincena = salarioBaseNum / 2;
        const baseISSS = Math.min(montoBrutoQuincena, 500);
        const descuentoISSS = baseISSS * 0.03;
        const descuentoAFP = montoBrutoQuincena * 0.0725;
        const montoNetoQuincena = montoBrutoQuincena - descuentoISSS - descuentoAFP - adelantoNum;

        resCalc = {
          montoBruto: montoBrutoQuincena,
          descuentoISSS: descuentoISSS,
          descuentoAFP: descuentoAFP,
          descuentoRenta: 0,
          montoNeto: montoNetoQuincena
        };
      }

      resultado = {
        tipo_pago: tipoPago,
        fecha_pago: new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }),
        monto_bruto: resCalc.montoBruto || resCalc.salario15Dias || 0,
        monto_bono_vacaciones: resCalc.montoBono || 0,
        descuento_isss: resCalc.descuentoISSS || 0,
        descuento_afp: resCalc.descuentoAFP || 0,
        descuento_renta: resCalc.descuentoRenta || 0,
        adelanto_salario: adelantoNum,
        monto_neto: resCalc.montoNeto || 0,
        dias_calculados: resCalc.diasCorresponden || 15,
        monto_letras: numeroALetras(resCalc.montoNeto || 0),
      };
    }

    setPagoCalculado(resultado);
  };

  const handleGuardarEnSupabase = async () => {
    if (!pagoCalculado || !empleado) return;
    setGuardando(true);
    
    const { error } = await supabase.from('pagos_registro').insert([{
      empleado_id: empleado.id,
      tipo_pago: tipoPago,
      monto_bruto: pagoCalculado.monto_bruto,
      monto_bono_vacaciones: pagoCalculado.monto_bono_vacaciones || 0,
      descuento_isss: pagoCalculado.descuento_isss || 0,
      descuento_afp: pagoCalculado.descuento_afp || 0,
      descuento_renta: pagoCalculado.descuento_renta || 0,
      adelanto_salario: pagoCalculado.adelanto_salario || 0,
      monto_neto: pagoCalculado.monto_neto,
      fecha_pago: pagoCalculado.fecha_pago || new Date().toISOString().split('T')[0],
    }]);

    setGuardando(false);
    if (error) {
      alert('Error al guardar el pago: ' + error.message);
    } else {
      alert('¡Pago registrado con éxito en la base de datos!');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600" />
          Procesamiento de Planilla
        </h2>
        <p className="text-slate-500">Completa los datos para generar y registrar un nuevo recibo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Izquierdo: Formulario */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Colaborador</label>
              <select
                value={empleadoSeleccionado}
                onChange={(e) => {
                  setEmpleadoSeleccionado(e.target.value);
                  setPagoCalculado(null);
                  const empEncontrado = empleados.find((emp) => String(emp.id) === String(e.target.value));
                  if (empEncontrado?.tipo_empleado === 'honorarios') {
                    setTipoPago('honorarios');
                  } else {
                    setTipoPago('quincena');
                  }
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
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
                  {empleado?.tipo_empleado === 'honorarios' ? (
                    <option value="honorarios">Servicios / Honorarios</option>
                  ) : (
                    <>
                      <option value="quincena">Salario Quincenal / Ordinario</option>
                      <option value="quincena_25">Quincena 25</option>
                      <option value="aguinaldo">Aguinaldo</option>
                      <option value="vacaciones">Vacaciones</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Adelantos / Préstamos ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={adelanto}
                  onChange={(e) => setAdelanto(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0.00"
                />
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  placeholder="Ej. 150.00"
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={handleCalcular}
                disabled={!empleadoSeleccionado}
                className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                Efectuar Cálculos
              </button>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Resumen y Acciones */}
        <div className="lg:col-span-5">
          {pagoCalculado && empleado ? (
            <div className="bg-emerald-50 border border-emerald-100 p-6 md:p-8 rounded-2xl shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6 text-emerald-800">
                <Receipt className="w-5 h-5" />
                <h3 className="text-lg font-bold">Desglose del Recibo</h3>
              </div>
              
              <div className="space-y-3 flex-grow">
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

                {pagoCalculado.adelanto_salario > 0 && (
                  <div className="flex justify-between text-sm text-rose-600">
                    <span>Descuento por Adelantos:</span>
                    <span>-${pagoCalculado.adelanto_salario.toFixed(2)}</span>
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

              <div className="mt-8 flex flex-col gap-3">
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
            <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50">
              <Receipt className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-medium">El resumen del recibo aparecerá aquí</p>
              <p className="text-sm mt-1">Selecciona un empleado y efectúa el cálculo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};