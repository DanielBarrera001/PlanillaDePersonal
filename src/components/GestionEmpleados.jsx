import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus, Calendar, PlusCircle, Trash2, Users, Edit3, X, UserCheck, Search, Clock, Camera, Upload, Eye } from 'lucide-react';

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
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-xl mt-3 transition-colors duration-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
          Control de Vacaciones Anuales (15 días)
        </h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          diasDisponibles > 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
        }`}>
          Disp: {diasDisponibles} de 15
        </span>
      </div>

      <form onSubmit={handleRegistrarDias} className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 mb-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
        <input
          type="number"
          step="0.5"
          placeholder="Días"
          value={diasInput}
          onChange={(e) => setDiasInput(e.target.value)}
          required
          className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-slate-200 dark:placeholder-slate-500 transition-colors"
        />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
          className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-slate-200 transition-colors"
        />
        <input
          type="text"
          placeholder="Motivo"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="p-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-slate-200 dark:placeholder-slate-500 transition-colors"
        />
        <button
          type="submit"
          disabled={guardando}
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {guardando ? '...' : 'Anotar'}
        </button>
      </form>

      {registros.length > 0 ? (
        <div className="space-y-1 max-h-28 overflow-y-auto">
          {registros.map((reg) => (
            <div key={reg.id} className="flex justify-between items-center bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-xs transition-colors">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">{reg.dias_tomados}d</span>
                <span className="text-slate-400 dark:text-slate-600 mx-1.5">|</span>
                <span className="text-slate-600 dark:text-slate-300">{reg.observacion}</span>
                <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1.5">({reg.fecha_inicio})</span>
              </div>
              <button
                type="button"
                onClick={() => handleEliminarRegistro(reg.id)}
                className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-1">Sin registros de vacaciones en este periodo.</p>
      )}
    </div>
  );
};

export const GestionEmpleados = ({ empleados = [], onEmpleadoAgregado }) => {
  const [formulario, setFormulario] = useState({
    nombre_completo: '', dui: '', cargo: '', tipo_empleado: 'planilla',
    tipo_jornada: 'Tiempo Completo', fecha_ingreso: '', salario_base: '', foto_url: ''
  });
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    nombre_completo: '', dui: '', cargo: '', tipo_empleado: 'planilla',
    tipo_jornada: 'Tiempo Completo', fecha_ingreso: '', salario_base: '', foto_url: ''
  });
  const [archivoFotoEdicion, setArchivoFotoEdicion] = useState(null);
  const [fotoPrevisualizando, setFotoPrevisualizando] = useState(null); 
  const [busquedaColaborador, setBusquedaColaborador] = useState('');

  const [temporales, setTemporales] = useState([]);
  const [formTemporal, setFormTemporal] = useState({ nombre: '', contacto: '', cargo: '', foto_url: '' });
  const [archivoFotoTemporal, setArchivoFotoTemporal] = useState(null);
  const [guardandoTemporal, setGuardandoTemporal] = useState(false);
  const [temporalEditando, setTemporalEditando] = useState(null);
  const [formTemporalEdicion, setFormTemporalEdicion] = useState({ nombre: '', contacto: '', cargo: '', foto_url: '' });
  const [archivoFotoTemporalEdicion, setArchivoFotoTemporalEdicion] = useState(null);

  useEffect(() => {
    cargarTemporales();
  }, []);

  const cargarTemporales = async () => {
    const { data, error } = await supabase.from('trabajadores_temporales').select('*').order('created_at', { ascending: false });
    if (!error && data) setTemporales(data);
  };

  const handleChange = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const convertirFileABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const subirImagenAStorage = async (file) => {
    if (!file) return null;
    let archivoParaSubir = file;
    try {
      const base64Clean = await convertirFileABase64(file);
      const resFunction = await fetch('/.netlify/functions/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Clean })
      });
      if (resFunction.ok) {
        const dataRes = await resFunction.json();
        const resFotoLimpia = await fetch(dataRes.base64);
        const blob = await resFotoLimpia.blob();
        archivoParaSubir = new File([blob], `${file.name.split('.')[0]}_sin_fondo.png`, { type: 'image/png' });
      } else {
        console.warn('No se pudo remover el fondo, subiendo imagen original...');
      }
    } catch (err) {
      console.error('Error al procesar Remove.bg, usando imagen original:', err);
    }

    const fileExt = archivoParaSubir.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('empleados-fotos').upload(fileName, archivoParaSubir);
    if (uploadError) throw new Error('Error al subir la imagen a Supabase: ' + uploadError.message);
    const { data } = supabase.storage.from('empleados-fotos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const regexDUI = /^\d{8}-\d{1}$/;
    if (!regexDUI.test(formulario.dui)) return alert('Formato de DUI inválido. Debe ser exactamente: 00000000-0');
    const salarioFijo = parseFloat(formulario.salario_base);
    if (isNaN(salarioFijo) || salarioFijo <= 0) return alert('El salario base debe ser un número mayor a cero.');

    setGuardando(true);
    try {
      let urlFotoFinal = formulario.foto_url;
      if (archivoFoto) urlFotoFinal = await subirImagenAStorage(archivoFoto);
      const { error } = await supabase.from('empleados').insert([{ ...formulario, salario_base: salarioFijo, foto_url: urlFotoFinal }]);
      if (error) throw error;
      alert('Colaborador registrado exitosamente');
      setFormulario({ nombre_completo: '', dui: '', cargo: '', tipo_empleado: 'planilla', tipo_jornada: 'Tiempo Completo', fecha_ingreso: '', salario_base: '', foto_url: '' });
      setArchivoFoto(null);
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (emp) => {
    setEmpleadoEditando(emp.id);
    setArchivoFotoEdicion(null);
    setFormEdicion({
      nombre_completo: emp.nombre_completo || '', dui: emp.dui || '', cargo: emp.cargo || '',
      tipo_empleado: emp.tipo_empleado || 'planilla', tipo_jornada: emp.tipo_jornada || 'Tiempo Completo',
      fecha_ingreso: emp.fecha_ingreso || '', salario_base: emp.salario_base || '', foto_url: emp.foto_url || ''
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!empleadoEditando) return;
    const regexDUI = /^\d{8}-\d{1}$/;
    if (!regexDUI.test(formEdicion.dui)) return alert('Formato de DUI inválido. Debe ser exactamente: 00000000-0');
    const salarioFijo = parseFloat(formEdicion.salario_base);
    if (isNaN(salarioFijo) || salarioFijo <= 0) return alert('El salario base debe ser un número mayor a cero.');

    try {
      let urlFotoFinal = formEdicion.foto_url;
      if (archivoFotoEdicion) urlFotoFinal = await subirImagenAStorage(archivoFotoEdicion);
      const { error } = await supabase.from('empleados').update({
        nombre_completo: formEdicion.nombre_completo, dui: formEdicion.dui, cargo: formEdicion.cargo,
        tipo_empleado: formEdicion.tipo_empleado, tipo_jornada: formEdicion.tipo_jornada,
        fecha_ingreso: formEdicion.fecha_ingreso, salario_base: salarioFijo, foto_url: urlFotoFinal
      }).eq('id', empleadoEditando);
      if (error) throw error;
      alert('¡Información actualizada con éxito!');
      setEmpleadoEditando(null);
      setArchivoFotoEdicion(null);
      if (onEmpleadoAgregado) onEmpleadoAgregado();
    } catch (error) {
      alert('Error al actualizar empleado: ' + error.message);
    }
  };

  const handleEliminarEmpleado = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al colaborador "${nombre}"?`)) return;
    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (error) alert('Error al eliminar empleado: ' + error.message);
    else { alert('Colaborador eliminado correctamente.'); if (onEmpleadoAgregado) onEmpleadoAgregado(); }
  };

  const handleGuardarTemporal = async (e) => {
    e.preventDefault();
    const regexTel = /^\d{8}$/;
    if (!regexTel.test(formTemporal.contacto)) return alert('El teléfono debe contener exactamente 8 dígitos numéricos.');

    setGuardandoTemporal(true);
    try {
      let urlFotoFinal = formTemporal.foto_url;
      if (archivoFotoTemporal) urlFotoFinal = await subirImagenAStorage(archivoFotoTemporal);
      const { error } = await supabase.from('trabajadores_temporales').insert([{ ...formTemporal, foto_url: urlFotoFinal }]);
      if (error) throw error;
      alert('Trabajador temporal registrado con éxito');
      setFormTemporal({ nombre: '', contacto: '', cargo: '', foto_url: '' });
      setArchivoFotoTemporal(null);
      cargarTemporales();
    } catch (error) {
      alert('Error al registrar trabajador temporal: ' + error.message);
    } finally {
      setGuardandoTemporal(false);
    }
  };

  const iniciarEdicionTemporal = (temp) => {
    setTemporalEditando(temp.id);
    setArchivoFotoTemporalEdicion(null);
    setFormTemporalEdicion({ nombre: temp.nombre || '', contacto: temp.contacto || '', cargo: temp.cargo || '', foto_url: temp.foto_url || '' });
  };

  const handleGuardarEdicionTemporal = async (e) => {
    e.preventDefault();
    if (!temporalEditando) return;
    const regexTel = /^\d{8}$/;
    if (!regexTel.test(formTemporalEdicion.contacto)) return alert('El teléfono debe contener exactamente 8 dígitos numéricos.');

    try {
      let urlFotoFinal = formTemporalEdicion.foto_url;
      if (archivoFotoTemporalEdicion) urlFotoFinal = await subirImagenAStorage(archivoFotoTemporalEdicion);
      const { error } = await supabase.from('trabajadores_temporales').update({
        nombre: formTemporalEdicion.nombre, contacto: formTemporalEdicion.contacto,
        cargo: formTemporalEdicion.cargo, foto_url: urlFotoFinal
      }).eq('id', temporalEditando);
      if (error) throw error;
      alert('¡Trabajador temporal actualizado con éxito!');
      setTemporalEditando(null);
      setArchivoFotoTemporalEdicion(null);
      cargarTemporales();
    } catch (error) {
      alert('Error al actualizar trabajador temporal: ' + error.message);
    }
  };

  const handleEliminarTemporal = async (id, nombre) => {
    if (!confirm(`¿Deseas eliminar al trabajador temporal "${nombre}"?`)) return;
    const { error } = await supabase.from('trabajadores_temporales').delete().eq('id', id);
    if (!error) cargarTemporales();
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const query = busquedaColaborador.toLowerCase();
    return emp.nombre_completo?.toLowerCase().includes(query) || emp.dui?.toLowerCase().includes(query) || emp.cargo?.toLowerCase().includes(query);
  });

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 py-6">
      
      {fotoPrevisualizando && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setFotoPrevisualizando(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl max-w-md w-full relative flex flex-col items-center border border-slate-100 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFotoPrevisualizando(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-3 text-center px-6 truncate w-full">
              {fotoPrevisualizando.nombre}
            </h3>

            <div className="w-full h-80 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <img 
                src={fotoPrevisualizando.url} 
                alt={fotoPrevisualizando.nombre} 
                className="w-full h-full object-contain" 
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Fotografía oficial</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
        
        {/* ================= COLUMNA IZQUIERDA: COLABORADORES REGISTRADOS ================= */}
        <div className="space-y-6 w-full">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              Registrar Nuevo Colaborador
            </h2>
            
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input required name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">DUI</label>
                  <input required name="dui" value={formulario.dui} onChange={handleChange} placeholder="00000000-0" maxLength="10" pattern="\d{8}-\d{1}" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                  <input required name="cargo" value={formulario.cargo} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contrato</label>
                  <select name="tipo_empleado" value={formulario.tipo_empleado} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors">
                    <option value="planilla">Planilla</option>
                    <option value="honorarios">Honorarios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jornada</label>
                  <select name="tipo_jornada" value={formulario.tipo_jornada} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors">
                    <option value="Tiempo Completo">Tiempo Completo</option>
                    <option value="Medio Tiempo">Medio Tiempo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ingreso</label>
                  <input required type="date" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salario Base Mensual ($)</label>
                  <input required type="number" step="0.01" name="salario_base" value={formulario.salario_base} onChange={handleChange} className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fotografía (JPG / PNG)</label>
                  <input type="file" accept="image/*" onChange={(e) => setArchivoFoto(e.target.files[0])} className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 dark:file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/20 text-slate-600 dark:text-slate-300 outline-none transition-colors" />
                </div>
              </div>
              
              <button type="submit" disabled={guardando} className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 shadow-md">
                {guardando ? 'Guardando en la nube...' : 'Registrar Colaborador'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                Colaboradores Registrados ({empleadosFiltrados.length}{empleadosFiltrados.length !== empleados.length ? ` de ${empleados.length}` : ''})
              </h3>
            </div>

            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, DUI o cargo..."
                value={busquedaColaborador}
                onChange={(e) => setBusquedaColaborador(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
              {busquedaColaborador && (
                <button
                  type="button"
                  onClick={() => setBusquedaColaborador('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {empleadoEditando && (
              <div className="mb-6 p-4 bg-emerald-50/70 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700/50 rounded-2xl shadow-sm transition-all">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Editando Colaborador
                  </h4>
                  <button type="button" onClick={() => setEmpleadoEditando(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800 p-1 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleGuardarEdicion} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nombre Completo</label>
                      <input required value={formEdicion.nombre_completo} onChange={(e) => setFormEdicion({ ...formEdicion, nombre_completo: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">DUI</label>
                      <input required value={formEdicion.dui} maxLength="10" placeholder="00000000-0" onChange={(e) => setFormEdicion({ ...formEdicion, dui: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Cargo</label>
                      <input required value={formEdicion.cargo} onChange={(e) => setFormEdicion({ ...formEdicion, cargo: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Tipo Contrato</label>
                      <select value={formEdicion.tipo_empleado} onChange={(e) => setFormEdicion({ ...formEdicion, tipo_empleado: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors">
                        <option value="planilla">Planilla</option>
                        <option value="honorarios">Honorarios</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Jornada</label>
                      <select value={formEdicion.tipo_jornada} onChange={(e) => setFormEdicion({ ...formEdicion, tipo_jornada: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors">
                        <option value="Tiempo Completo">Tiempo Completo</option>
                        <option value="Medio Tiempo">Medio Tiempo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Fecha Ingreso</label>
                      <input required type="date" value={formEdicion.fecha_ingreso} onChange={(e) => setFormEdicion({ ...formEdicion, fecha_ingreso: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Salario Base Mensual ($)</label>
                      <input required type="number" step="0.01" value={formEdicion.salario_base} onChange={(e) => setFormEdicion({ ...formEdicion, salario_base: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nueva Fotografía (Opcional)</label>
                      <input type="file" accept="image/*" onChange={(e) => setArchivoFotoEdicion(e.target.files[0])} className="w-full p-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 dark:file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 transition-colors" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setEmpleadoEditando(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-colors">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            )}

            {empleadosFiltrados.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {empleadosFiltrados.map((emp) => (
                  <div key={emp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xs transition-colors">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        {emp.foto_url ? (
                          <div className="relative group cursor-pointer shrink-0" onClick={() => setFotoPrevisualizando({ url: emp.foto_url, nombre: emp.nombre_completo })} title="Ver fotografía en grande">
                            <img src={emp.foto_url} alt={emp.nombre_completo} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 dark:border-emerald-400 shadow-2xs group-hover:opacity-90 transition-opacity" />
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200 dark:border-emerald-500/30">
                            {emp.nombre_completo ? emp.nombre_completo.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{emp.nombre_completo}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">DUI: {emp.dui} | Cargo: <span className="font-medium text-slate-700 dark:text-slate-300">{emp.cargo}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.tipo_empleado === 'honorarios' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {emp.tipo_empleado === 'honorarios' ? 'Honorarios' : 'Planilla'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {emp.tipo_jornada || 'Tiempo Completo'}
                        </span>
                        <div className="flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
                          <button type="button" onClick={() => iniciarEdicion(emp)} className="p-1.5 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg transition-colors" title="Editar">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => handleEliminarEmpleado(emp.id, emp.nombre_completo)} className="p-1.5 bg-slate-100 dark:bg-slate-700/50 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>Ingreso: <strong className="text-slate-700 dark:text-slate-300">{emp.fecha_ingreso}</strong></span>
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">${Number(emp.salario_base || 0).toFixed(2)}/m</span>
                    </div>

                    <ControlVacacionesEmpleado empleado={emp} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-6 text-sm">
                {empleados.length === 0 ? 'No hay colaboradores registrados todavía.' : 'No se encontraron colaboradores con esa búsqueda.'}
              </p>
            )}
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: TRABAJADORES TEMPORALES ================= */}
        <div className="space-y-6 w-full">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              Registrar Trabajador Temporal
            </h2>
            
            <form onSubmit={handleGuardarTemporal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input required value={formTemporal.nombre} onChange={(e) => setFormTemporal({ ...formTemporal, nombre: e.target.value })} placeholder="Ej. Juan Pérez" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition-colors" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono (8 dígitos)</label>
                  <input required type="text" maxLength="8" value={formTemporal.contacto} onChange={(e) => setFormTemporal({ ...formTemporal, contacto: e.target.value.replace(/\D/g, '') })} placeholder="Ej. 70000000" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                  <input required value={formTemporal.cargo} onChange={(e) => setFormTemporal({ ...formTemporal, cargo: e.target.value })} placeholder="Ej. Apoyo en Bodega" className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fotografía (JPG / PNG)</label>
                <input type="file" accept="image/*" onChange={(e) => setArchivoFotoTemporal(e.target.files[0])} className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 dark:file:bg-amber-500/10 file:text-amber-700 dark:file:text-amber-400 hover:file:bg-amber-100 dark:hover:file:bg-amber-500/20 text-slate-600 dark:text-slate-300 outline-none transition-colors" />
              </div>
              
              <button type="submit" disabled={guardandoTemporal} className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-md">
                {guardandoTemporal ? 'Guardando temporal...' : 'Guardar Trabajador Temporal'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              Trabajadores Temporales ({temporales.length})
            </h3>

            {temporalEditando && (
              <div className="mb-6 p-4 bg-amber-50/70 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl shadow-sm transition-all">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-amber-900 dark:text-amber-400 text-sm flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-amber-700 dark:text-amber-400" /> Editando Trabajador Temporal
                  </h4>
                  <button type="button" onClick={() => setTemporalEditando(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-800 p-1 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleGuardarEdicionTemporal} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nombre Completo</label>
                    <input required value={formTemporalEdicion.nombre} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, nombre: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Teléfono (8 dígitos)</label>
                      <input required type="text" maxLength="8" value={formTemporalEdicion.contacto} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, contacto: e.target.value.replace(/\D/g, '') })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Cargo</label>
                      <input required value={formTemporalEdicion.cargo} onChange={(e) => setFormTemporalEdicion({ ...formTemporalEdicion, cargo: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-200 outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nueva Fotografía (Opcional)</label>
                    <input type="file" accept="image/*" onChange={(e) => setArchivoFotoTemporalEdicion(e.target.files[0])} className="w-full p-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-amber-50 dark:file:bg-amber-500/10 file:text-amber-700 dark:file:text-amber-400 transition-colors" />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setTemporalEditando(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs transition-colors">Cancelar</button>
                    <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs hover:bg-amber-700 transition-colors">Guardar Cambios</button>
                  </div>
                </form>
              </div>
            )}

            {temporales.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {temporales.map((temp) => (
                  <div key={temp.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xs flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-3">
                      {temp.foto_url ? (
                        <div className="relative group cursor-pointer shrink-0" onClick={() => setFotoPrevisualizando({ url: temp.foto_url, nombre: temp.nombre })} title="Ver fotografía en grande">
                          <img src={temp.foto_url} alt={temp.nombre} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 dark:border-amber-400 shadow-2xs group-hover:opacity-90 transition-opacity" />
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200 dark:border-amber-500/30">
                          {temp.nombre ? temp.nombre.charAt(0).toUpperCase() : 'T'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{temp.nombre}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Cargo: <span className="font-medium text-slate-700 dark:text-slate-300">{temp.cargo}</span></p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tel: {temp.contacto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
                      <button type="button" onClick={() => iniciarEdicionTemporal(temp)} className="p-2 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-400 rounded-xl transition-colors" title="Editar trabajador temporal">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleEliminarTemporal(temp.id, temp.nombre)} className="p-2 bg-slate-100 dark:bg-slate-700/50 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-400 rounded-xl transition-colors" title="Eliminar trabajador temporal">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-6 text-sm">No hay trabajadores temporales registrados.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};