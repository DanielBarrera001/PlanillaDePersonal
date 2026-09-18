import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar as CalendarIcon, MapPin, Clock, User, PlusCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export const ControlTurnos = ({ empleados: empleadosProp = [] }) => {
  // Estados de datos
  const [empleados, setEmpleados] = useState(empleadosProp);
  const [temporales, setTemporales] = useState([]);
  const [turnos, setTurnos] = useState([]);
  
  // Estados del formulario de designación
  const [localSeleccionado, setLocalSeleccionado] = useState('Local 1');
  const [tipoJornada, setTipoJornada] = useState('Tiempo Completo');
  const [tipoPersona, setTipoPersona] = useState('formal'); // 'formal' or 'temporal'
  const [personaId, setPersonaId] = useState('');
  const [fechaTurno, setFechaTurno] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' }));
  const [guardando, setGuardando] = useState(false);

  // Estados para la navegación del calendario mensual
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    cargarEmpleados();
    cargarTemporales();
    cargarTurnos();
  }, []);

  const cargarEmpleados = async () => {
    const { data, error } = await supabase.from('empleados').select('*').order('nombre_completo');
    if (!error && data) {
      setEmpleados(data);
    }
  };

  const cargarTemporales = async () => {
    const { data, error } = await supabase.from('trabajadores_temporales').select('*').order('nombre');
    if (!error && data) setTemporales(data);
  };

  const cargarTurnos = async () => {
    const { data, error } = await supabase.from('turnos_asignados').select('*');
    if (!error && data) setTurnos(data);
  };

  // Manejador para designar turno
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
      local: localSeleccionado,
      tipo_jornada: tipoJornada,
      fecha_turno: fechaTurno
    }]);

    setGuardando(false);

    if (error) {
      alert('Error al asignar el turno: ' + error.message);
    } else {
      alert('¡Turno asignado con éxito!');
      setPersonaId('');
      cargarTurnos();
    }
  };

  const handleEliminarTurno = async (id) => {
    if (!confirm('¿Deseas remover esta asignación de turno?')) return;
    const { error } = await supabase.from('turnos_asignados').delete().eq('id', id);
    if (!error) {
      cargarTurnos();
    }
  };

  // --- Lógica del Calendario Mensual ---
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth(); // 0-11

  const primerDiaMes = new Date(anio, mes, 1).getDay(); // Día de la semana (0-6)
  const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate(); // Total días del mes

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cambiarMes = (direccion) => {
    setFechaActual(new Date(anio, mes + direccion, 1));
  };

  // Generar matriz de días del mes
  const diasCalendario = [];
  for (let i = 0; i < primerDiaMes; i++) {
    diasCalendario.push(null);
  }
  for (let d = 1; d <= ultimoDiaMes; d++) {
    const mesStr = String(mes + 1).padStart(2, '0');
    const diaStr = String(d).padStart(2, '0');
    diasCalendario.push(`${anio}-${mesStr}-${diaStr}`);
  }

  // IDs de personas que YA tienen turno asignado en la fecha seleccionada (fechaTurno)
  const idsOcupadosFecha = turnos
    .filter(t => t.fecha_turno === fechaTurno)
    .map(t => String(t.empleado_id || t.temporal_id));

  // Filtrar empleados formales por jornada y excluyendo los ya asignados hoy
  const empleadosFiltradosPorJornada = empleados.filter(emp => {
    const jornadaEmp = emp.tipo_jornada || 'Tiempo Completo';
    const coincideJornada = jornadaEmp === tipoJornada;
    const noAsignadoHoy = !idsOcupadosFecha.includes(String(emp.id));
    return coincideJornada && noAsignadoHoy;
  });

  // Filtrar temporales excluyendo los ya asignados hoy
  const temporalesDisponibles = temporales.filter(temp => {
    return !idsOcupadosFecha.includes(String(temp.id));
  });

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        
        {/* ================= COLUMNA IZQUIERDA: CALENDARIO MENSUAL ================= */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
              Calendario de Turnos: {nombresMeses[mes]} {anio}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setFechaActual(new Date())}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => cambiarMes(1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((diaSemana) => (
              <span key={diaSemana} className="text-xs font-bold text-slate-400 uppercase">
                {diaSemana}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {diasCalendario.map((fechaStr, index) => {
              if (!fechaStr) {
                return <div key={`empty-${index}`} className="min-h-[110px] bg-slate-50/50 rounded-xl border border-transparent"></div>;
              }

              const diaNumero = Number(fechaStr.split('-')[2]);
              const turnosDelDia = turnos.filter(t => t.fecha_turno === fechaStr);
              const esHoy = fechaStr === new Date().toLocaleDateString('en-CA', { timeZone: 'America/El_Salvador' });

              return (
                <div
                  key={fechaStr}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    esHoy ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      esHoy ? 'bg-emerald-600 text-white' : 'text-slate-700'
                    }`}>
                      {diaNumero}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">{turnosDelDia.length} turnos</span>
                  </div>

                  <div className="space-y-1 mt-1.5 max-h-20 overflow-y-auto pr-0.5">
                    {turnosDelDia.map((t) => (
                      <div
                        key={t.id}
                        className={`p-1 rounded text-[10px] flex items-center justify-between gap-1 shadow-2xs ${
                          t.local === 'Local 1' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                        title={`${t.nombre_persona} - ${t.local} (${t.tipo_jornada})`}
                      >
                        <div className="truncate">
                          <span className="font-bold truncate">{t.nombre_persona}</span>
                          <div className="text-[9px] opacity-80 truncate">{t.local} • {t.tipo_jornada === 'Tiempo Completo' ? 'TC' : 'MT'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarTurno(t.id)}
                          className="text-rose-500 hover:text-rose-700 shrink-0"
                          title="Remover turno"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ================= COLUMNA DERECHA: PANEL DE DESIGNACIÓN ================= */}
        <div className="lg:col-span-4 space-y-6 w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              Designar Turno
            </h2>

            <form onSubmit={handleDesignarTurno} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Local Asignado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalSeleccionado('Local 1')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      localSeleccionado === 'Local 1' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Local 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSeleccionado('Local 2')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      localSeleccionado === 'Local 2' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Local 2
                  </button>
                </div>
              </div>

              {/* Fecha del Turno (Colocado antes de seleccionar persona para que filtre en tiempo real) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha del Turno</label>
                <input
                  type="date"
                  value={fechaTurno}
                  onChange={(e) => {
                    setFechaTurno(e.target.value);
                    setPersonaId(''); // Limpiar selección al cambiar de fecha
                  }}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Tipo de Jornada */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Tipo de Jornada
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoJornada('Tiempo Completo');
                      setPersonaId('');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      tipoJornada === 'Tiempo Completo' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tiempo Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoJornada('Medio Tiempo');
                      setPersonaId('');
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      tipoJornada === 'Medio Tiempo' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Medio Tiempo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría de Personal</label>
                <select
                  value={tipoPersona}
                  onChange={(e) => {
                    setTipoPersona(e.target.value);
                    setPersonaId('');
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="formal">Colaborador Registrado (Planilla / Honorarios)</option>
                  <option value="temporal">Trabajador Temporal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> Seleccionar Persona Disponible
                </label>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">
                    {tipoPersona === 'formal' && empleadosFiltradosPorJornada.length === 0
                      ? `-- No hay disponibles para esta fecha/jornada --`
                      : tipoPersona === 'temporal' && temporalesDisponibles.length === 0
                      ? `-- No hay temporales disponibles hoy --`
                      : '-- Seleccionar --'}
                  </option>
                  {tipoPersona === 'formal' ? (
                    empleadosFiltradosPorJornada.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre_completo} ({emp.cargo})
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
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-md"
              >
                {guardando ? 'Asignando...' : 'Asignar Turno'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">Resumen General</h3>
            <p className="text-xs text-slate-500">
              Total de turnos asignados este mes: <strong className="text-emerald-600">{turnos.length}</strong>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};