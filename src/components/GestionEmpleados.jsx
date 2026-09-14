import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Calendar, PlusCircle, Trash2, Users, Edit3, X } from 'lucide-react';

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
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          Control de Vacaciones Anuales (15 días)
        </h4>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
          diasDisponibles > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}>
          Disponibles: {diasDisponibles} de 15 días
        </span>
      </div>

      <form onSubmit={handleRegistrarDias} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 bg-white p-2.5 rounded-lg border border-slate-100">
        <input
          type="number"
          step="0.5"
          placeholder="Días (ej. 2)"
          value={diasInput}
          onChange={(e) => setDiasInput(e.target.value)}
          required
          className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
          className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <input
          type="text"
          placeholder="Motivo (ej. Permiso)"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
        />
        <button
          type="submit"
          disabled={guardando}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {guardando ? 'Guardando...' : 'Anotar Días'}
        </button>
      </form>

      {registros.length > 0 ? (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {registros.map((reg) => (
            <div key={reg.id} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-800">{reg.dias_tomados} {reg.dias_tomados === 1 ? 'día' : 'días'}</span>
                <span className="text-slate-400 mx-2">|</span>
                <span className="text-slate-600">{reg.observacion}</span>
                <span className="text-slate-400 text-[10px] ml-2">({reg.fecha_inicio})</span>
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
        <p className="text-xs text-slate-400 text-center py-1">No hay días de vacaciones registrados en este periodo.</p>
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

  // Estados para Edición
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    nombre_completo: '',
    dui: '',
    cargo: '',
    tipo_empleado: 'planilla',
    fecha_ingreso: '',
    salario_base: ''
  });

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

    const { error } = await supabase.from('empleados').insert([
      {
        ...formulario,
        salario_base: salarioFijo,
      }
    ]);

    setGuardando(false);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      alert('Colaborador registrado exitosamente');
      setFormulario({ nombre_completo: '', dui: '', cargo: '', tipo_empleado: 'planilla', fecha_ingreso: '', salario_base: '' });
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    }
  };

  // Activar modo edición y cargar datos en el formulario flotante
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
    // Opcional: Desplazar la pantalla automáticamente hacia arriba para ver el formulario de edición
    window.scrollTo({ top: 300, behavior: 'smooth' });
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
    if (!confirm(`¿Estás seguro de eliminar al colaborador "${nombre}"? Se perderán todos sus registros asociados.`)) return;

    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar empleado: ' + error.message);
    } else {
      alert('Colaborador eliminado correctamente.');
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Formulario de Registro */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-emerald-600" />
          Registrar Nuevo Colaborador
        </h2>
        
        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <input required name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">DUI</label>
              <input 
                required 
                name="dui" 
                value={formulario.dui} 
                onChange={handleChange} 
                placeholder="00000000-0"
                maxLength="10"
                pattern="\d{8}-\d{1}"
                title="El formato debe ser 00000000-0"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo</label>
              <input required name="cargo" value={formulario.cargo} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Contrato</label>
              <select name="tipo_empleado" value={formulario.tipo_empleado} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="planilla">Planilla / Ordinario</option>
                <option value="honorarios">Servicios / Honorarios</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Ingreso</label>
              <input required type="date" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Salario Base Mensual ($)</label>
              <input required type="number" step="0.01" name="salario_base" value={formulario.salario_base} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          
          <button type="submit" disabled={guardando} className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors disabled:opacity-50 shadow-md">
            {guardando ? 'Guardando registro...' : 'Registrar Colaborador'}
          </button>
        </form>
      </div>

      {/* Listado de Colaboradores Existentes */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          Colaboradores Registrados ({empleados.length})
        </h3>

        {/* Modal / Formulario Flotante de Edición */}
        {empleadoEditando && (
          <div className="mb-8 p-6 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl shadow-md transition-all">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-emerald-900 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" /> Editando Información de Colaborador
              </h4>
              <button 
                type="button" 
                onClick={() => setEmpleadoEditando(null)} 
                className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    required value={formEdicion.nombre_completo}
                    onChange={(e) => setFormEdicion({ ...formEdicion, nombre_completo: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DUI</label>
                  <input
                    required value={formEdicion.dui} maxLength="10" placeholder="00000000-0"
                    onChange={(e) => setFormEdicion({ ...formEdicion, dui: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                  <input
                    required value={formEdicion.cargo}
                    onChange={(e) => setFormEdicion({ ...formEdicion, cargo: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Contrato</label>
                  <select
                    value={formEdicion.tipo_empleado}
                    onChange={(e) => setFormEdicion({ ...formEdicion, tipo_empleado: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="planilla">Planilla / Ordinario</option>
                    <option value="honorarios">Servicios / Honorarios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Ingreso</label>
                  <input
                    required type="date" value={formEdicion.fecha_ingreso}
                    onChange={(e) => setFormEdicion({ ...formEdicion, fecha_ingreso: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salario Base Mensual ($)</label>
                  <input
                    required type="number" step="0.01" value={formEdicion.salario_base}
                    onChange={(e) => setFormEdicion({ ...formEdicion, salario_base: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button" onClick={() => setEmpleadoEditando(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        )}

        {empleados.length > 0 ? (
          <div className="space-y-6">
            {empleados.map((emp) => (
              <div key={emp.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{emp.nombre_completo}</h4>
                    <p className="text-xs text-slate-500">DUI: {emp.dui} | Cargo: <span className="font-medium text-slate-700">{emp.cargo}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      emp.tipo_empleado === 'honorarios' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {emp.tipo_empleado === 'honorarios' ? 'Servicios / Honorarios' : 'Planilla'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-700">
                      ${Number(emp.salario_base || 0).toFixed(2)} / mes
                    </span>
                    
                    {/* Botones de Editar y Eliminar */}
                    <div className="flex items-center gap-1.5 ml-2 border-l pl-3 border-slate-200">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(emp)}
                        className="p-2 bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer"
                        title="Editar colaborador"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarEmpleado(emp.id, emp.nombre_completo)}
                        className="p-2 bg-slate-100 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-2">
                  Fecha de Ingreso: <span className="font-semibold text-slate-700">{emp.fecha_ingreso}</span>
                </div>

                {/* Módulo de Control de Vacaciones integrado para cada colaborador de planilla */}
                <ControlVacacionesEmpleado empleado={emp} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">No hay colaboradores registrados todavía.</p>
        )}
      </div>
    </div>
  );
};