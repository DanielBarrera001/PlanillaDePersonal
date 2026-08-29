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
  const [vistaActual, setVistaActual] = useState('generar');

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
    <div className="min-h-screen bg-slate-50">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
              R
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Centro de Copias La Rana</h1>
              <p className="text-xs text-slate-500 font-medium">{sesion.user.email}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setVistaActual('generar')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'generar' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              Generar Pago
            </button>
            
            <button
              onClick={() => setVistaActual('historial')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'historial' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <History className="w-4 h-4" />
              Historial
            </button>

            <button
              onClick={() => setVistaActual('personal')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'personal' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Personal
            </button>
          </div>

          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      {/* Contenedor Principal Ensanchado */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
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