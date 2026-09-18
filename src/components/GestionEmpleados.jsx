import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Calendar, PlusCircle, Trash2, Users, Edit3, X, UserCheck, Search } from 'lucide-react';

// Componente interno para gestionar las vacaciones de cada empleado listado
const ControlVacacionesEmpleado = ({ empleado }) => {
  const [registros, setRegistros] = useState([]);
  const [diasInput, setDiasInput] = useState('');
  const [observacion, setObservacion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (empleado?.id) {
      cargarRegistrosVacaciones();
    }
  }, [empleado]);

  const cargarRegistrosVacaciones = async () => {
    const { data, error } = await supabase
      .from('vacaciones_registros')
      .select('*')
      .eq('empleado_id', empleado.id)
      .order('fecha_inicio', { ascending: false });

    if (!error && data) {
      setRegistros(data);
    }
  };

  const totalDiasTomados = registros.reduce((acc, curr) => acc + Number(curr.dias_tomados || 0), 0);
  const diasDisponibles = Math.max(0, 15 - totalDiasTomados);

  const handleRegistrarDias = async (e) => {
    e.preventDefault();
    const diasNum = parseFloat(diasInput);
    
    if (isNaN(diasNum) || diasNum <= 0) {
      alert('Ingresa una cantidad válida de días.');
      return;
    }

    if (totalDiasTomados + diasNum > 15) {
      alert('¡Atención! La cantidad excede los 15 días disponibles de este periodo.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from('vacaciones_registros').insert([{
      empleado_id: empleado.id,
      dias_tomados: diasNum,
      fecha_inicio: fechaInicio || new Date().toISOString().split('T')[0],
      observacion: observacion || 'Vacaciones / Permiso'
    }]);

    setGuardando(false);

    if (error) {
      alert('Error al registrar: ' + error.message);
    } else {
      setDiasInput('');
      setObservacion('');
      setFechaInicio('');
      cargarRegistrosVacaciones();
    }
  };

  const handleEliminarRegistro = async (id) => {
    if (!confirm('¿Deseas eliminar este registro de vacaciones?')) return;
    
    const { error } = await supabase.from('vacaciones_registros').delete().eq('id', id);
    if (!error) {
      cargarRegistrosVacaciones();
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mt-3">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          Control de Vacaciones Anuales (15 días)
        </h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          diasDisponibles > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          Disp: {diasDisponibles} de 15
        </span>
      </div>

      <form onSubmit={handleRegistrarDias} className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 mb-2 bg-white p-2 rounded-lg border border-slate-100">
        <input
          type="number"
          step="0.5"
          placeholder="Días"
          value={diasInput}
          onChange={(e) => setDiasInput(e.target.value)}
          required
          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <input
          type="text"
          placeholder="Motivo"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <button
          type="submit"
          disabled={guardando}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {guardando ? '...' : 'Anotar'}
        </button>
      </form>

      {registros.length > 0 ? (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {registros.map((reg) => (
            <div key={reg.id} className="flex justify-between items-center bg-white px-2.5 py-1 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-800">{reg.dias_tomados}d</span>
                <span className="text-slate-400 mx-1.5">|</span>
                <span className="text-slate-600">{reg.observacion}</span>
                <span className="text-slate-400 text-[10px] ml-1.5">({reg.fecha_inicio})</span>
              </div>
              <button
                type="button"
                onClick={() => handleEliminarRegistro(reg.id)}
                className="text-rose-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 text-center py-1">Sin registros de vacaciones en este periodo.</p>
      )}
    </div>
  );
};

export const GestionEmpleados = ({ empleados = [], onEmpleadoAgregado }) => {
  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dui: '',
    cargo: '',
    tipo_empleado: 'planilla',
    fecha_ingreso: '',
    salario_base: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    nombre_completo: '',
    dui: '',
    cargo: '',
    tipo_empleado: 'planilla',
    fecha_ingreso: '',
    salario_base: ''
  });

  // Estado para el buscador de colaboradores oficiales
  const [busquedaColaborador, setBusquedaColaborador] = useState('');

  // Estados para Trabajadores Temporales
  const [temporales, setTemporales] = useState([]);
  const [formTemporal, setFormTemporal] = useState({
    nombre: '',
    contacto: '',
    cargo: ''
  });
  const [guardandoTemporal, setGuardandoTemporal] = useState(false);
  const [temporalEditando, setTemporalEditando] = useState(null);
  const [formTemporalEdicion, setFormTemporalEdicion] = useState({
    nombre: '',
    contacto: '',
    cargo: ''
  });

  useEffect(() => {
    cargarTemporales();
  }, []);

  const cargarTemporales = async () => {
    const { data, error } = await supabase.from('trabajadores_temporales').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setTemporales(data);
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const regexDUI = /^\d{8}-\d{1}$/;
    if (!regexDUI.test(formulario.dui)) {
      alert('Formato de DUI inválido. Debe ser exactamente: 00000000-0');
      return;
    }

    const salarioFijo = parseFloat(formulario.salario_base);
    if (isNaN(salarioFijo) || salarioFijo <= 0) {
      alert('El salario base debe ser un número mayor a cero.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from('empleados').insert([{ ...formulario, salario_base: salarioFijo }]);
    setGuardando(false);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      alert('Colaborador registrado exitosamente');
      setFormulario({ nombre_completo: '', dui: '', cargo: '', tipo_empleado: 'planilla', fecha_ingreso: '', salario_base: '' });
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    }
  };

  const iniciarEdicion = (emp) => {
    setEmpleadoEditando(emp.id);
    setFormEdicion({
      nombre_completo: emp.nombre_completo || '',
      dui: emp.dui || '',
      cargo: emp.cargo || '',
      tipo_empleado: emp.tipo_empleado || 'planilla',
      fecha_ingreso: emp.fecha_ingreso || '',
      salario_base: emp.salario_base || ''
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!empleadoEditando) return;

    const regexDUI = /^\d{8}-\d{1}$/;
    if (!regexDUI.test(formEdicion.dui)) {
      alert('Formato de DUI inválido. Debe ser exactamente: 00000000-0');
      return;
    }

    const salarioFijo = parseFloat(formEdicion.salario_base);
    if (isNaN(salarioFijo) || salarioFijo <= 0) {
      alert('El salario base debe ser un número mayor a cero.');
      return;
    }

    const { error } = await supabase
      .from('empleados')
      .update({
        nombre_completo: formEdicion.nombre_completo,
        dui: formEdicion.dui,
        cargo: formEdicion.cargo,
        tipo_empleado: formEdicion.tipo_empleado,
        fecha_ingreso: formEdicion.fecha_ingreso,
        salario_base: salarioFijo
      })
      .eq('id', empleadoEditando);

    if (error) {
      alert('Error al actualizar empleado: ' + error.message);
    } else {
      alert('¡Información actualizada con éxito!');
      setEmpleadoEditando(null);
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    }
  };

  const handleEliminarEmpleado = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al colaborador "${nombre}"?`)) return;
    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar empleado: ' + error.message);
    } else {
      alert('Colaborador eliminado correctamente.');
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    }
  };

  // Funciones para Trabajadores Temporales
  const handleGuardarTemporal = async (e) => {
    e.preventDefault();
    const regexTel = /^\d{8}$/;
    if (!regexTel.test(formTemporal.contacto)) {
      alert('El teléfono debe contener exactamente 8 dígitos numéricos (ej. 70000000).');
      return;
    }

    setGuardandoTemporal(true);
    const { error } = await supabase.from('trabajadores_temporales').insert([formTemporal]);
    setGuardandoTemporal(false);

    if (error) {
      alert('Error al registrar trabajador temporal: ' + error.message);
    } else {
      alert('Trabajador temporal registrado con éxito');
      setFormTemporal({ nombre: '', contacto: '', cargo: '' });
      cargarTemporales();
    }
  };

  const iniciarEdicionTemporal = (temp) => {
    setTemporalEditando(temp.id);
    setFormTemporalEdicion({
      nombre: temp.nombre || '',
      contacto: temp.contacto || '',
      cargo: temp.cargo || ''
    });
  };

  const handleGuardarEdicionTemporal = async (e) => {
    e.preventDefault();
    if (!temporalEditando) return;

    const regexTel = /^\d{8}$/;
    if (!regexTel.test(formTemporalEdicion.contacto)) {
      alert('El teléfono debe contener exactamente 8 dígitos numéricos.');
      return;
    }

    const { error } = await supabase
      .from('trabajadores_temporales')
      .update({
        nombre: formTemporalEdicion.nombre,
        contacto: formTemporalEdicion.contacto,
        cargo: formTemporalEdicion.cargo
      })
      .eq('id', temporalEditando);

    if (error) {
      alert('Error al actualizar trabajador temporal: ' + error.message);
    } else {
      alert('¡Trabajador temporal actualizado con éxito!');
      setTemporalEditando(null);
      cargarTemporales();
    }
  };

  const handleEliminarTemporal = async (id, nombre) => {
    if (!confirm(`¿Deseas eliminar al trabajador temporal "${nombre}"?`)) return;
    const { error } = await supabase.from('trabajadores_temporales').delete().eq('id', id);
    if (!error) {
      cargarTemporales();
    }
  };

  // Filtrado de colaboradores registrados según el buscador (por nombre o DUI)
  const empleadosFiltrados = empleados.filter((emp) => {
    const query = busquedaColaborador.toLowerCase();
    const nombreMatch = emp.nombre_completo?.toLowerCase().includes(query);
    const duiMatch = emp.dui?.toLowerCase().includes(query);
    const cargoMatch = emp.cargo?.toLowerCase().includes(query);
    return nombreMatch || duiMatch || cargoMatch;
  });

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
        
        {/* ================= COLUMNA IZQUIERDA: COLABORADORES REGISTRADOS ================= */}
        <div className="space-y-6 w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Registrar Nuevo Colaborador
            </h2>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input required name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DUI</label>
                  <input 
                    required 
                    name="dui" 
                    value={formulario.dui} 
                    onChange={handleChange} 
                    placeholder="00000000-0"
                    maxLength="10"
                    pattern="\d{8}-\d{1}"
                    title="El formato debe ser 00000000-0"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                  <input required name="cargo" value={formulario.cargo} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contrato</label>
                  <select name="tipo_empleado" value={formulario.tipo_empleado} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="planilla">Planilla</option>
                    <option value="honorarios">Honorarios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ingreso</label>
                  <input required type="date" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salario ($)</label>
                  <input required type="number" step="0.01" name="salario_base" value={formulario.salario_base} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              
              <button type="submit" disabled={guardando} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors disabled:opacity-50 shadow-md">
                {guardando ? 'Guardando...' : 'Registrar Colaborador'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Colaboradores Registrados ({empleadosFiltrados.length}{empleadosFiltrados.length !== empleados.length ? ` de ${empleados.length}` : ''})
              </h3>
            </div>

            {/* Barra de búsqueda para empleados */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, DUI o cargo..."
                value={busquedaColaborador}
                onChange={(e) => setBusquedaColaborador(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              {busquedaColaborador && (
                <button
                  type="button"
                  onClick={() => setBusquedaColaborador('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {empleadoEditando && (
              <div className="mb-6 p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl shadow-sm transition-all">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-700" /> Editando Colaborador
                  </h4>
                  <button type="button" onClick={() => setEmpleadoEditando(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleGuardarEdicion} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nombre Completo</label>
                      <input required value={formEdicion.nombre_completo} onChange={(e) => setFormEdicion({ ...formEdicion, nombre_completo: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">DUI</label>
                      <input required value={formEdicion.dui} maxLength="10" placeholder="00000000-0" onChange={(e) => setFormEdicion({ ...formEdicion, dui: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Cargo</label>
                      <input required value={formEdicion.cargo} onChange={(e) => setFormEdicion({ ...formEdicion, cargo: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tipo Contrato</label>
                      <select value={formEdicion.tipo_empleado} onChange={(e) => setFormEdicion({ ...formEdicion, tipo_empleado: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none">
                        <option value="planilla">Planilla</option>
                        <option value="honorarios">Honorarios</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Fecha Ingreso</label>
                      <input required type="date" value={formEdicion.fecha_ingreso} onChange={(e) => setFormEdicion({ ...formEdicion, fecha_ingreso: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Salario Base ($)</label>
                      <input required type="number" step="0.01" value={formEdicion.salario_base} onChange={(e) => setFormEdicion({ ...formEdicion, salario_base: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setEmpleadoEditando(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            )}

            {empleadosFiltrados.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {empleadosFiltrados.map((emp) => (
                  <div key={emp.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{emp.nombre_completo}</h4>
                        <p className="text-[11px] text-slate-500">DUI: {emp.dui} | Cargo: <span className="font-medium text-slate-700">{emp.cargo}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.tipo_empleado === 'honorarios' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {emp.tipo_empleado === 'honorarios' ? 'Honorarios' : 'Planilla'}
                        </span>
                        <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                          <button type="button" onClick={() => iniciarEdicion(emp)} className="p-1.5 bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors" title="Editar">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleEliminarEmpleado(emp.id, emp.nombre_completo)} className="p-1.5 bg-slate-100 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                      <span>Ingreso: <strong className="text-slate-700">{emp.fecha_ingreso}</strong></span>
                      <span className="text-sm font-extrabold text-slate-700">${Number(emp.salario_base || 0).toFixed(2)}/m</span>
                    </div>

                    <ControlVacacionesEmpleado empleado={emp} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-6 text-sm">
                {empleados.length === 0 ? 'No hay colaboradores registrados todavía.' : 'No se encontraron colaboradores con esa búsqueda.'}
              </p>
            )}
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: TRABAJADORES TEMPORALES (SIN BUSCADOR) ================= */}
        <div className="space-y-6 w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              Registrar Trabajador Temporal
            </h2>
            
            <form onSubmit={handleGuardarTemporal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  required 
                  value={formTemporal.nombre} 
                  onChange={(e) => setFormTemporal({ ...formTemporal, nombre: e.target.value })} 
                  placeholder="Ej. Juan Pérez"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono (8 dígitos)</label>
                <input 
                  required 
                  type="text"
                  maxLength="8"
                  value={formTemporal.contacto} 
                  onChange={(e) => setFormTemporal({ ...formTemporal, contacto: e.target.value.replace(/\D/g, '') })} 
                  placeholder="Ej. 70000000"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                <input 
                  required 
                  value={formTemporal.cargo} 
                  onChange={(e) => setFormTemporal({ ...formTemporal, cargo: e.target.value })} 
                  placeholder="Ej. Apoyo en Bodega"
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={guardandoTemporal} 
                className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-md"
              >
                {guardandoTemporal ? 'Guardando temporal...' : 'Guardar Trabajador Temporal'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600" />
              Trabajadores Temporales ({temporales.length})
            </h3>

            {/* Modal / Formulario Flotante de Edición para Temporal */}
            {temporalEditando && (
              <div className="mb-6 p-4 bg-amber-50/70 border-2 border-amber-300 rounded-2xl shadow-sm transition-all">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-700" /> Editando Trabajador Temporal
                  </h4>
                  <button type="button" onClick={() => setTemporalEditando(null)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleGuardarEdicionTemporal} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Nombre Completo</label>
                    <input required value={formTemporalEdicion.nombre} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, nombre: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Teléfono (8 dígitos)</label>
                    <input required type="text" maxLength="8" value={formTemporalEdicion.contacto} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, contacto: e.target.value.replace(/\D/g, '') })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Cargo</label>
                    <input required value={formTemporalEdicion.cargo} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, cargo: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none" />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setTemporalEditando(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-xs">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            )}

            {temporales.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {temporales.map((temp) => (
                  <div key={temp.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{temp.nombre}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Cargo: <span className="font-medium text-slate-700">{temp.cargo}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">Tel: {temp.contacto}</p>
                    </div>
                    <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                      <button
                        type="button"
                        onClick={() => iniciarEdicionTemporal(temp)}
                        className="p-2 bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 rounded-xl transition-colors"
                        title="Editar trabajador temporal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarTemporal(temp.id, temp.nombre)}
                        className="p-2 bg-slate-100 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors"
                        title="Eliminar trabajador temporal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-6 text-sm">No hay trabajadores temporales registrados.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};