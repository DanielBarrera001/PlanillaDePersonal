import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RefreshCcw, History, Search } from 'lucide-react';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { numeroALetras } from '../utils/numeroALetras';

export const HistorialPagos = () => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargarHistorial = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('pagos_registro')
      .select('*, empleados(*)')
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

  // Filtrar registros por nombre del empleado
  const historialFiltrado = historial.filter((item) => 
    item.empleados?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Historial de Pagos y Recibos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Consulta, reimprime o descarga los comprobantes emitidos anteriormente.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button 
            onClick={cargarHistorial}
            className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
            title="Actualizar datos"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      {cargando ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Fecha Emisión</th>
                <th className="px-5 py-4">Colaborador</th>
                <th className="px-5 py-4">Concepto</th>
                <th className="px-5 py-4 text-right">Monto Bruto</th>
                <th className="px-5 py-4 text-right">Adelantos</th>
                <th className="px-5 py-4 text-right">Líquido Pagado</th>
                <th className="px-5 py-4 text-center">Acción PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                    No se encontraron registros de pagos.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((registro) => (
                  <tr key={registro.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 text-slate-600 font-medium">{registro.fecha_pago}</td>
                    <td className="px-5 py-4 font-bold text-slate-800">
                      {registro.empleados?.nombre_completo || 'Desconocido'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold tracking-wide">
                        {formatearTipo(registro.tipo_pago)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-700">${Number(registro.monto_bruto).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-rose-600 font-medium">
                      {registro.adelanto_salario > 0 ? `-$${Number(registro.adelanto_salario).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-emerald-600">
                      ${Number(registro.monto_neto).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-block scale-95 origin-center">
                        <BotonDescargaPDF 
                          tipoRecibo={registro.tipo_pago}
                          empleado={registro.empleados}
                          pago={registro}
                          monto={registro.monto_neto}
                          montoLetras={numeroALetras(registro.monto_neto)}
                        />
                      </div>
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