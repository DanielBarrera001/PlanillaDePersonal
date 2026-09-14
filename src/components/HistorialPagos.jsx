import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RefreshCcw, History, Search, Trash2, Filter } from 'lucide-react';
import { BotonDescargaPDF } from './pdf/BotonDescargaPDF';
import { numeroALetras } from '../utils/numeroALetras';

export const HistorialPagos = () => {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

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

  const formatearTipo = (tipo, esEspecial) => {
    if (esEspecial && tipo === 'credito') return 'Crédito / Inversión';
    if (esEspecial) return 'Adelanto / Préstamo';
    const tipos = {
      aguinaldo: 'Aguinaldo',
      vacaciones: 'Vacaciones',
      quincena_25: 'Quincena 25',
      quincena: 'Salario Quincenal',
      honorarios: 'Honorarios',
      credito: 'Crédito'
    };
    return tipos[tipo] || tipo;
  };

  const handleEliminarRegistro = async (id) => {
    if (!confirm('¿Deseas eliminar este registro del historial?')) return;
    const { error } = await supabase.from('pagos_registro').delete().eq('id', id);
    if (!error) {
      cargarHistorial();
    }
  };

  const historialFiltrado = historial.filter((item) => {
    const coincideNombre = item.empleados?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                           item.empleado_nombre?.toLowerCase().includes(busqueda.toLowerCase());
    
    const esEspecial = (Number(item.monto_bruto) === 0 && Number(item.adelanto_salario) > 0) || item.tipo_pago === 'credito';

    if (!coincideNombre) return false;

    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'adelantos') return Number(item.monto_bruto) === 0 && Number(item.adelanto_salario) > 0;
    if (filtroTipo === 'credito') return item.tipo_pago === 'credito';
    if (filtroTipo === 'quincena') return item.tipo_pago === 'quincena' && !esEspecial;
    if (filtroTipo === 'quincena_25') return item.tipo_pago === 'quincena_25' && !esEspecial;
    if (filtroTipo === 'aguinaldo') return item.tipo_pago === 'aguinaldo' && !esEspecial;
    if (filtroTipo === 'vacaciones') return item.tipo_pago === 'vacaciones' && !esEspecial;
    return true;
  });

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Historial de Pagos y Recibos
          </h2>
          <p className="text-slate-500 text-sm mt-1">Consulta, reimprime o descarga los comprobantes y adelantos emitidos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full sm:w-48 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="todos">Todos los conceptos</option>
              <option value="adelantos">Adelantos / Préstamos</option>
              <option value="credito">Créditos</option>
              <option value="quincena">Salario Quincenal</option>
              <option value="quincena_25">Quincena 25</option>
              <option value="aguinaldo">Aguinaldo</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>

          <div className="relative flex-grow sm:w-64">
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
                <th className="px-5 py-4">Concepto / Detalle</th>
                <th className="px-5 py-4 text-right">Monto Bruto</th>
                <th className="px-5 py-4 text-right">Adelantos / Créditos</th>
                <th className="px-5 py-4 text-right">Líquido / Neto</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historialFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                historialFiltrado.map((registro) => {
                  const esEspecial = (Number(registro.monto_bruto) === 0 && Number(registro.adelanto_salario) > 0) || registro.tipo_pago === 'credito';
                  
                  // Captura el valor ya sea de adelanto, de credito_otorgado o del monto neto si es un registro directo de crédito
                  const valorMontoEspecial = Number(registro.adelanto_salario) > 0 
                    ? Number(registro.adelanto_salario) 
                    : (Number(registro.credito_otorgado) > 0 ? Number(registro.credito_otorgado) : Number(registro.monto_neto || 0));

                  return (
                    <tr key={registro.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-slate-600 font-medium">{registro.fecha_pago}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {registro.empleados?.nombre_completo || registro.empleado_nombre || 'Desconocido'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide ${
                          esEspecial ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {formatearTipo(registro.tipo_pago, esEspecial)}
                        </span>
                        {registro.observaciones && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{registro.observaciones}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-700">${Number(registro.monto_bruto).toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-rose-600 font-medium">
                        {valorMontoEspecial > 0 ? `-$${valorMontoEspecial.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-5 py-4 text-right font-extrabold ${esEspecial ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ${Number(registro.monto_neto).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!esEspecial ? (
                            <BotonDescargaPDF 
                              tipoRecibo={registro.tipo_pago}
                              empleado={registro.empleados}
                              pago={registro}
                              monto={registro.monto_neto}
                              montoLetras={numeroALetras(registro.monto_neto)}
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Registro Interno</span>
                          )}

                          <button 
                            onClick={() => handleEliminarRegistro(registro.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};