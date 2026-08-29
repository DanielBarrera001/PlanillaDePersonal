import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RefreshCcw } from 'lucide-react';

export const HistorialPagos = () => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarHistorial = async () => {
    setCargando(true);
    // Hacemos un join con la tabla empleados para obtener el nombre
    const { data, error } = await supabase
      .from('pagos_registro')
      .select('*, empleados(nombre_completo)')
      .order('fecha_pago', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHistorial(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatearTipo = (tipo) => {
    const tipos = {
      aguinaldo: 'Aguinaldo',
      vacaciones: 'Vacaciones',
      quincena_25: 'Quincena 25',
      honorarios: 'Honorarios'
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Historial de Pagos Emitidos</h2>
        <button 
          onClick={cargarHistorial}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Actualizar datos"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {cargando ? (
        <p className="text-center text-gray-500 py-4">Cargando registros...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 border-b">Fecha Emisión</th>
                <th className="px-4 py-3 border-b">Colaborador</th>
                <th className="px-4 py-3 border-b">Concepto</th>
                <th className="px-4 py-3 border-b text-right">Monto Bruto</th>
                <th className="px-4 py-3 border-b text-right">Adelantos</th>
                <th className="px-4 py-3 border-b text-right">Líquido Pagado</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No hay pagos registrados en el historial.
                  </td>
                </tr>
              ) : (
                historial.map((registro) => (
                  <tr key={registro.id} className="hover:bg-slate-50 border-b last:border-0">
                    <td className="px-4 py-3 text-slate-600">{registro.fecha_pago}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {registro.empleados?.nombre_completo || 'Desconocido'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        {formatearTipo(registro.tipo_pago)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">${Number(registro.monto_bruto).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {registro.adelanto_salario > 0 ? `-$${Number(registro.adelanto_salario).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      ${Number(registro.monto_neto).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};