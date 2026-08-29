import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserPlus } from 'lucide-react';

export const GestionEmpleados = ({ onEmpleadoAgregado }) => {
  const [formulario, setFormulario] = useState({
    nombre_completo: '',
    dui: '',
    cargo: '',
    tipo_empleado: 'planilla',
    fecha_ingreso: '',
    salario_base: ''
  });
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    
    // Validación de DUI (8 dígitos, guion, 1 dígito)
    const regexDUI = /^\d{8}-\d{1}$/;
    if (!regexDUI.test(formulario.dui)) {
      alert('Formato de DUI inválido. Debe ser exactamente: 00000000-0');
      return;
    }

    // Validación de Salario
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-slate-700" />
        Registrar Nuevo Colaborador
      </h2>
      
      <form onSubmit={handleGuardar} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input required name="nombre_completo" value={formulario.nombre_completo} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DUI</label>
            <input 
                required 
                name="dui" 
                value={formulario.dui} 
                onChange={handleChange} 
                placeholder="00000000-0"
                maxLength="10"
                pattern="\d{8}-\d{1}"
                title="El formato debe ser 00000000-0"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input required name="cargo" value={formulario.cargo} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
            <select name="tipo_empleado" value={formulario.tipo_empleado} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="planilla">Planilla / Ordinario</option>
              <option value="honorarios">Servicios / Honorarios</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
            <input required type="date" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base Mensual ($)</label>
            <input required type="number" step="0.01" name="salario_base" value={formulario.salario_base} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        
        <button type="submit" disabled={guardando} className="w-full mt-4 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:opacity-50">
          {guardando ? 'Guardando registro...' : 'Registrar Colaborador'}
        </button>
      </form>
    </div>
  );
};