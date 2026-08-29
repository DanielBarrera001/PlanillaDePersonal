import { ControlVacacionesEmpleado } from './ControlVacacionesEmpleado';

// Y dentro de tu mapeo o listado de empleados en pantalla:
{empleados.map((emp) => (
  <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-4">
    {/* Datos generales del empleado */}
    <h3 className="font-bold text-slate-800 text-lg">{emp.nombre_completo}</h3>
    <p className="text-sm text-slate-500">Cargo: {emp.cargo}</p>

    {/* Aquí insertas el módulo de vacaciones para que controle sus días de forma independiente */}
    <ControlVacacionesEmpleado empleado={emp} />
  </div>
))}