import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { FormularioPagos } from './components/FormularioPagos';
import { HistorialPagos } from './components/HistorialPagos';
import { GestionEmpleados } from './components/GestionEmpleados';
import { Login } from './components/Login';
import { LogOut, FilePlus, History, Users } from 'lucide-react';

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState('generar'); // 'generar', 'historial' o 'personal'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      if (session) obtenerEmpleados();
      else setCargando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session);
      if (session) obtenerEmpleados();
      else setCargando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const obtenerEmpleados = async () => {
    setCargando(true);
    const { data, error } = await supabase.from('empleados').select('*').order('nombre_completo');
    if (!error && data) {
      setEmpleados(data);
    }
    setCargando(false);
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  if (!sesion) {
    return <Login onLoginSuccess={(nuevaSesion) => setSesion(nuevaSesion)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Centro de Copias La Rana</h1>
          <p className="text-xs text-slate-500">{sesion.user.email}</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setVistaActual('generar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActual === 'generar' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FilePlus className="w-4 h-4" />
            Generar Pago
          </button>
          
          <button
            onClick={() => setVistaActual('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActual === 'historial' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Historial
          </button>

          <button
            onClick={() => setVistaActual('personal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              vistaActual === 'personal' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Personal
          </button>
        </div>

        <button
          onClick={handleCerrarSesion}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </header>

      <main>
        {cargando ? (
          <p className="text-center text-gray-500">Cargando sistema...</p>
        ) : (
          vistaActual === 'generar' 
            ? <FormularioPagos empleados={empleados} /> 
            : vistaActual === 'historial'
            ? <HistorialPagos />
            : <GestionEmpleados onEmpleadoAgregado={obtenerEmpleados} />
        )}
      </main>
    </div>
  );
}