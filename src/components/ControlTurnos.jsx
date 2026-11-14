import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  FileText,
  Briefcase,
  Sun
} from 'lucide-react';
import { TurnosPDF } from './pdf/TurnosPDF';
import { DescansosVacacionesPDF } from './pdf/DescansosVacacionesPDF';

export const ControlTurnos = ({ empleados: empleadosProp = [] }) => {
  const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });

  // Estados de datos
  const [empleados, setEmpleados] = useState(empleadosProp);
  const [temporales, setTemporales] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);

  // Estados del formulario de designación
  const [localSeleccionado, setLocalSeleccionado] = useState('Local 1');
  const [tipoJornada, setTipoJornada] = useState('Tiempo Completo');
  const [tipoPersona, setTipoPersona] = useState('formal');
  const [personaId, setPersonaId] = useState('');
  const [fechaTurno, setFechaTurno] = useState(hoyStr);
  const [guardando, setGuardando] = useState(false);

  // Estados para la tarjeta unificada de Reportes PDF
  const [tabPdf, setTabPdf] = useState('turnos'); // 'turnos' | 'ausencias'
  const [fechaInicioPdf, setFechaInicioPdf] = useState('');
  const [fechaFinPdf, setFechaFinPdf] = useState('');
  const [fechaAusenciasPdf, setFechaAusenciasPdf] = useState(hoyStr);

  // Estados para la navegación del calendario mensual
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    cargarEmpleados();
    cargarTemporales();
    cargarTurnos();
    cargarVacaciones();
  }, []);

  const cargarEmpleados = async () => {
    const { data, error } = await supabase.from('empleados').select('*').order('nombre_completo');
    if (!error && data) setEmpleados(data);
  };

  const cargarTemporales = async () => {
    const { data, error } = await supabase.from('trabajadores_temporales').select('*').order('nombre');
    if (!error && data) setTemporales(data);
  };

  const cargarTurnos = async () => {
    const { data, error } = await supabase.from('turnos_asignados').select('*');
    if (!error && data) setTurnos(data);
  };

  const cargarVacaciones = async () => {
    const { data, error } = await supabase
      .from('vacaciones_registros')
      .select('*, empleados(nombre_completo)');
    if (!error && data) setVacaciones(data);
  };

  const handleSeleccionarDiaCalendario = (fechaStr) => {
    setFechaTurno(fechaStr);
    setFechaAusenciasPdf(fechaStr);
    setPersonaId('');
  };

  const handleDesignarTurno = async (e) => {
    e.preventDefault();
    if (!personaId || !fechaTurno) {
      alert('Por favor selecciona una persona y una fecha.');
      return;
    }

    let nombrePersona = '';
    let empId = null;
    let tempId = null;

    if (tipoPersona === 'formal') {
      const emp = empleados.find(e => String(e.id) === String(personaId));
      if (!emp) return;
      nombrePersona = emp.nombre_completo;
      empId = emp.id;
    } else {
      const temp = temporales.find(t => String(t.id) === String(personaId));
      if (!temp) return;
      nombrePersona = temp.nombre;
      tempId = temp.id;
    }

    setGuardando(true);
    const { error } = await supabase.from('turnos_asignados').insert([{
      empleado_id: empId,
      temporal_id: tempId,
      nombre_persona: nombrePersona,
      local: tipoJornada === 'Descanso' ? 'Local 1' : localSeleccionado,
      tipo_jornada: tipoJornada,
      fecha_turno: fechaTurno
    }]);

    setGuardando(false);

    if (error) {
      alert('Error al registrar: ' + error.message);
    } else {
      alert(tipoJornada === 'Descanso' ? '¡Día de descanso registrado con éxito!' : '¡Turno asignado con éxito!');
      setPersonaId('');
      cargarTurnos();
    }
  };

  const handleEliminarTurno = async (e, id) => {
    e.stopPropagation();
    if (!confirm('¿Deseas remover este registro?')) return;
    const { error } = await supabase.from('turnos_asignados').delete().eq('id', id);
    if (!error) cargarTurnos();
  };

  // --- Lógica del Calendario Mensual ---
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cambiarMes = (direccion) => {
    setFechaActual(new Date(anio, mes + direccion, 1));
  };

  const diasCalendario = [];
  for (let i = 0; i < primerDiaMes; i++) diasCalendario.push(null);
  for (let d = 1; d <= ultimoDiaMes; d++) {
    const mesStr = String(mes + 1).padStart(2, '0');
    const diaStr = String(d).padStart(2, '0');
    diasCalendario.push(`${anio}-${mesStr}-${diaStr}`);
  }

  // Helper para obtener vacaciones activas en una fecha específica
  const obtenerVacacionesEnFecha = (fechaStr) => {
    if (!fechaStr) return [];
    const consulta = new Date(`${fechaStr}T00:00:00`);
    return vacaciones
      .filter((v) => {
        if (!v.fecha_inicio) return false;
        const inicio = new Date(`${v.fecha_inicio}T00:00:00`);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + Math.max(0, Number(v.dias_tomados) - 1));
        return consulta >= inicio && consulta <= fin;
      })
      .map((v) => ({
        ...v,
        nombre_empleado:
          v.empleados?.nombre_completo ||
          empleados.find((e) => e.id === v.empleado_id)?.nombre_completo ||
          'Empleado registrado',
      }));
  };

  const idsOcupadosFecha = turnos
    .filter(t => t.fecha_turno === fechaTurno)
    .map(t => String(t.empleado_id || t.temporal_id));

  const empleadosFiltradosPorJornada = empleados.filter(emp => {
    const jornadaEmp = emp.tipo_jornada || 'Tiempo Completo';
    const coincideJornada = tipoJornada === 'Descanso' ? true : (jornadaEmp === tipoJornada);
    const noAsignadoHoy = !idsOcupadosFecha.includes(String(emp.id));
    return coincideJornada && noAsignadoHoy;
  });

  const temporalesDisponibles = temporales.filter(temp => !idsOcupadosFecha.includes(String(temp.id)));

  // Filtrado para PDFs
  const descansosDelDiaPdf = turnos.filter(
    (t) => t.tipo_jornada === 'Descanso' && t.fecha_turno === fechaAusenciasPdf
  );
  const vacacionesDelDiaPdf = obtenerVacacionesEnFecha(fechaAusenciasPdf);

  const proximosDescansos = turnos
    .filter(t => t.tipo_jornada === 'Descanso' && t.fecha_turno >= hoyStr)
    .sort((a, b) => a.fecha_turno.localeCompare(b.fecha_turno));

  const mesActualPrefix = `${anio}-${String(mes + 1).padStart(2, '0')}`;
  const registrosMesActual = turnos.filter(t => t.fecha_turno.startsWith(mesActualPrefix)).length;

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full">

        {/* ================= COLUMNA IZQUIERDA: CALENDARIO MENSUAL (8 cols) ================= */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors">

          {/* Cabecera y Navegación */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 mb-5 border-b border-slate-100 dark:border-slate-700/80">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-700 dark:text-emerald-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                {nombresMeses[mes]} {anio}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Haz clic en un día para seleccionarlo en el panel • <span className="font-semibold text-emerald-600 dark:text-emerald-400">{registrosMesActual} registros este mes</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Leyenda compacta */}
              <div className="hidden md:flex items-center gap-2.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Local 1</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>Local 2</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Descanso</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>Vacaciones</span>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-all"
                  title="Mes Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFechaActual(new Date());
                    handleSeleccionarDiaCalendario(hoyStr);
                  }}
                  className="px-3 py-1 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-all"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-all"
                  title="Mes Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((diaSemana) => (
              <span key={diaSemana} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
                {diaSemana}
              </span>
            ))}
          </div>

          {/* Cuadrícula del calendario */}
          <div className="grid grid-cols-7 gap-2">
            {diasCalendario.map((fechaStr, index) => {
              if (!fechaStr) {
                return <div key={`empty-${index}`} className="min-h-[120px] bg-slate-50/60 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200/60 dark:border-slate-800"></div>;
              }

              const diaNumero = Number(fechaStr.split('-')[2]);
              const turnosDelDia = turnos.filter(t => t.fecha_turno === fechaStr);
              const vacsDelDia = obtenerVacacionesEnFecha(fechaStr);
              const esHoy = fechaStr === hoyStr;
              const esSeleccionado = fechaStr === fechaTurno;

              return (
                <div
                  key={fechaStr}
                  onClick={() => handleSeleccionarDiaCalendario(fechaStr)}
                  className={`min-h-[120px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    esSeleccionado
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/30'
                      : esHoy
                      ? 'border-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                      esHoy
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : esSeleccionado
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {diaNumero}
                    </span>

                    <div className="flex items-center gap-1">
                      {vacsDelDia.length > 0 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300"
                          title={`Vacaciones: ${vacsDelDia.map(v => v.nombre_empleado).join(', ')}`}
                        >
                          🏖️ {vacsDelDia.length}
                        </span>
                      )}
                      {turnosDelDia.length > 0 && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                          {turnosDelDia.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[84px] overflow-y-auto pr-0.5">
  {/* Tarjetas de Vacaciones Activas */}
  {vacsDelDia.map((v) => (
    <div
      key={`vac-${v.id}-${fechaStr}`}
      className="px-1.5 py-1 rounded-md text-[10px] border-l-2 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border-sky-500"
      title={`${v.nombre_empleado} — Vacaciones (${v.observacion || 'Período anual'})`}
    >
      <div className="truncate leading-tight">
        <span className="font-bold block truncate">{v.nombre_empleado}</span>
        <span className="text-[9px] opacity-80">🏖️ Vacaciones</span>
      </div>
    </div>
  ))}

              {/* Tarjetas de Turnos y Descansos */}
              {turnosDelDia.map((t) => {
                const esDescanso = t.tipo_jornada === 'Descanso';
                return (
                  <div
                    key={t.id}
                    className={`px-1.5 py-1 rounded-md text-[10px] flex items-center justify-between gap-1 border-l-2 ${
                      esDescanso
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-500'
                        : t.local === 'Local 1'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-500'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-500'
                    }`}
                    title={`${t.nombre_persona} — ${esDescanso ? 'Descanso' : `${t.local} (${t.tipo_jornada})`}`}
                  >
                    <div className="truncate leading-tight">
                      <span className="font-bold block truncate">{t.nombre_persona}</span>
                      <span className="text-[9px] opacity-75">
                        {esDescanso ? 'Descanso' : `${t.local} • ${t.tipo_jornada === 'Tiempo Completo' ? 'TC' : 'MT'}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleEliminarTurno(e, t.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 shrink-0 p-0.5 rounded transition-colors"
                      title="Remover registro"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: ACCIONES Y REPORTES (4 cols) ================= */}
        <div className="xl:col-span-4 space-y-5">

          {/* 1. FORMULARIO PRINCIPAL: DESIGNAR TURNO O DESCANSO */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Asignar Turno / Descanso
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {fechaTurno}
              </span>
            </div>

            <form onSubmit={handleDesignarTurno} className="space-y-4">
              {/* Selector de Tipo de Registro */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Tipo de Jornada
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setTipoJornada('Tiempo Completo'); setPersonaId(''); }}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all ${
                      tipoJornada === 'Tiempo Completo'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    T. Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoJornada('Medio Tiempo'); setPersonaId(''); }}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all ${
                      tipoJornada === 'Medio Tiempo'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    M. Tiempo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoJornada('Descanso'); setPersonaId(''); }}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all ${
                      tipoJornada === 'Descanso'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    🏖️ Descanso
                  </button>
                </div>
              </div>

              {/* Selector de Local (oculto en Descanso) */}
              {tipoJornada !== 'Descanso' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Local Asignado
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocalSeleccionado('Local 1')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        localSeleccionado === 'Local 1'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Local 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalSeleccionado('Local 2')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        localSeleccionado === 'Local 2'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Local 2
                    </button>
                  </div>
                </div>
              )}

              {/* Fecha y Categoría en 2 columnas para ahorrar espacio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={fechaTurno}
                    onChange={(e) => {
                      setFechaTurno(e.target.value);
                      setPersonaId('');
                    }}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Personal
                  </label>
                  <select
                    value={tipoPersona}
                    onChange={(e) => {
                      setTipoPersona(e.target.value);
                      setPersonaId('');
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="formal">Planilla / Formal</option>
                    <option value="temporal">Temporal</option>
                  </select>
                </div>
              </div>

              {/* Seleccionar Persona */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Colaborador Disponible
                </label>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">
                    {tipoPersona === 'formal' && empleadosFiltradosPorJornada.length === 0
                      ? '-- Sin personal disponible en esta fecha --'
                      : tipoPersona === 'temporal' && temporalesDisponibles.length === 0
                      ? '-- Sin temporales disponibles --'
                      : '-- Seleccionar colaborador --'}
                  </option>
                  {tipoPersona === 'formal' ? (
                    empleadosFiltradosPorJornada.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre_completo} ({emp.cargo || 'Colaborador'})
                      </option>
                    ))
                  ) : (
                    temporalesDisponibles.map((temp) => (
                      <option key={temp.id} value={temp.id}>
                        {temp.nombre} ({temp.cargo})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className={`w-full py-3 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-sm cursor-pointer ${
                  tipoJornada === 'Descanso'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {guardando
                  ? 'Guardando...'
                  : tipoJornada === 'Descanso'
                  ? 'Registrar Día de Descanso'
                  : 'Confirmar Asignación de Turno'}
              </button>
            </form>
          </div>

          {/* 2. CENTRO DE REPORTES PDF (UNIFICADO CON PESTAÑAS) */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Exportar Reportes PDF
              </h3>
            </div>

            {/* Selector de pestañas */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setTabPdf('turnos')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  tabPdf === 'turnos'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Turnos
              </button>
              <button
                type="button"
                onClick={() => setTabPdf('ausencias')}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  tabPdf === 'ausencias'
                    ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Descansos / Vac.
              </button>
            </div>

            {tabPdf === 'turnos' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={fechaInicioPdf}
                      onChange={(e) => setFechaInicioPdf(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={fechaFinPdf}
                      onChange={(e) => setFechaFinPdf(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <TurnosPDF
                  turnos={turnos.filter(t => (!fechaInicioPdf || t.fecha_turno >= fechaInicioPdf) && (!fechaFinPdf || t.fecha_turno <= fechaFinPdf))}
                  fechaInicio={fechaInicioPdf}
                  fechaFin={fechaFinPdf}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Consulta
                  </label>
                  <input
                    type="date"
                    value={fechaAusenciasPdf}
                    onChange={(e) => setFechaAusenciasPdf(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 dark:bg-slate-900/70 p-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">En Descanso</span>
                    <strong className="text-sm text-amber-600 dark:text-amber-400">{descansosDelDiaPdf.length}</strong>
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase text-slate-400 block">De Vacaciones</span>
                    <strong className="text-sm text-sky-600 dark:text-sky-400">{vacacionesDelDiaPdf.length}</strong>
                  </div>
                </div>

                <DescansosVacacionesPDF
                  fecha={fechaAusenciasPdf}
                  descansos={descansosDelDiaPdf}
                  vacaciones={vacacionesDelDiaPdf}
                />
              </div>
            )}
          </div>

          {/* 3. PRÓXIMOS DESCANSOS PROGRAMADOS */}
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Próximos Descansos
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                {proximosDescansos.length}
              </span>
            </div>

            {proximosDescansos.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                No hay días de descanso programados próximamente.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {proximosDescansos.map((d) => (
                  <div
                    key={d.id}
                    className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-3 py-2 rounded-xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{d.nombre_persona}</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{d.fecha_turno}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleEliminarTurno(e, d.id)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Cancelar descanso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};