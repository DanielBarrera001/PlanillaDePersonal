import React, { useState } from 'react';
import { calcularAguinaldo, calcularVacaciones, calcularQuincena25 } from '../utils/calculos';
import { numeroALetras } from '../utils/numeroALetras';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { supabase } from '../lib/supabaseClient';

export const FormularioPagos = ({ empleados = [] }) => {
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [tipoPago, setTipoPago] = useState('aguinaldo');
  const [adelanto, setAdelanto] = useState(0);
  const [montoHonorario, setMontoHonorario] = useState(0);
  const [pagoCalculado, setPagoCalculado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Comparación directa de String (Soporta UUIDs de Supabase)
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
      }

      resultado = {
        tipo_pago: tipoPago,
        fecha_pago: new Date().toISOString().split('T')[0],
        monto_bruto: resCalc.montoBruto || resCalc.salario15Dias || 0,
        monto_bono_vacaciones: resCalc.montoBono || 0,
        descuento_isss: resCalc.descuentoISSS || 0, // Nuevo
        descuento_afp: resCalc.descuentoAFP || 0,   // Nuevo
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
    const { error } = await supabase.from('pagos_registro').insert([
      {
        empleado_id: empleado.id,
        tipo_pago: tipoPago,
        monto_bruto: pagoCalculado.monto_bruto,
        monto_bono_vacaciones: pagoCalculado.monto_bono_vacaciones || 0,
        descuento_renta: pagoCalculado.descuento_renta || 0,
        adelanto_salario: pagoCalculado.adelanto_salario || 0,
        monto_neto: pagoCalculado.monto_neto,
        descuento_isss: pagoCalculado.descuento_isss || 0,
        descuento_afp: pagoCalculado.descuento_afp || 0,
        fecha_pago: pagoCalculado.fecha_pago || new Date().toISOString().split('T')[0],
      },
    ]);

    setGuardando(false);
    if (error) {
      alert('Error al guardar el pago: ' + error.message);
    } else {
      alert('¡Pago registrado con éxito en la base de datos!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Generar Recibo de Pago</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
          <select
            value={empleadoSeleccionado}
            onChange={(e) => {
              setEmpleadoSeleccionado(e.target.value);
              setPagoCalculado(null);
            }}
            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Selecciona un colaborador --</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre_completo} ({emp.tipo_empleado === 'honorarios' ? 'Servicios / Honorarios' : 'Planilla'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
            <select
              value={tipoPago}
              onChange={(e) => {
                setTipoPago(e.target.value);
                setPagoCalculado(null);
              }}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="aguinaldo">Aguinaldo</option>
              <option value="vacaciones">Vacaciones</option>
              <option value="quincena_25">Quincena 25</option>
              <option value="honorarios">Servicios / Honorarios</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adelanto / Descuento ($)</label>
            <input
              type="number"
              step="0.01"
              value={adelanto}
              onChange={(e) => setAdelanto(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        {tipoPago === 'honorarios' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Honorarios ($)</label>
            <input
              type="number"
              step="0.01"
              value={montoHonorario}
              onChange={(e) => setMontoHonorario(e.target.value)}
              className="w-full p-2.5 border rounded-lg"
              placeholder="Monto total del servicio"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleCalcular}
          disabled={!empleadoSeleccionado}
          className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
        >
          Calcular y Preparar Recibo
        </button>
      </div>

      {pagoCalculado && empleado && (
        <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-800">Resumen del Recibo</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Monto Bruto:</span> ${pagoCalculado.monto_bruto.toFixed(2)}</p>
            {pagoCalculado.adelanto_salario > 0 && (
              <p className="text-red-600"><span className="font-medium">Adelanto:</span> -${pagoCalculado.adelanto_salario.toFixed(2)}</p>
            )}
            <p className="text-lg font-bold text-emerald-700">
              Monto Líquido: ${pagoCalculado.monto_neto.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
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
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              {guardando ? 'Guardando...' : 'Guardar en Historial'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};