import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { FormularioPagos } from './components/FormularioPagos';
import { HistorialPagos } from './components/HistorialPagos';
import { ControlTurnos } from './components/ControlTurnos';
import { GestionEmpleados } from './components/GestionEmpleados';
import { GestionCreditos } from './components/GestionCreditos';
import { Login } from './components/Login';
import { LogOut, FilePlus, History, Users, CreditCard, Sun, Moon } from 'lucide-react';

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el Modo Oscuro (persiste en localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dark_mode') === 'true';
  });

  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('vista_actual') || 'generar';
  });

  useEffect(() => {
    localStorage.setItem('dark_mode', darkMode);
  }, [darkMode]);

  const cambiarVista = (vista) => {
    setVistaActual(vista);
    localStorage.setItem('vista_actual', vista);
  };

  useEffect(() => {
    let isMounted = true;

    // Carga inicial de sesión y empleados
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSesion(session);
      if (session) {
        await obtenerEmpleados();
      }
      setCargando(false);
    });

    // Escuchar cambios críticos de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSesion(session);
        if (session && empleados.length === 0) {
          await obtenerEmpleados();
        }
      } else if (event === 'SIGNED_OUT') {
        setSesion(null);
        setEmpleados([]);
        setCargando(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const obtenerEmpleados = async () => {
    const { data, error } = await supabase.from('empleados').select('*').order('nombre_completo');
    if (!error && data) {
      setEmpleados(data);
    }
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  if (!sesion) {
    return <Login onLoginSuccess={(nuevaSesion) => setSesion(nuevaSesion)} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Barra de Navegación Superior */}
      <header className={`border-b sticky top-0 z-10 transition-colors duration-200 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
              R
            </div>
            <div>
              <h1 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Centro de Copias La Ranita</h1>
              <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{sesion.user.email}</p>
            </div>
          </div>
          
          <div className={`flex flex-wrap justify-center gap-2 p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => cambiarVista('generar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'generar' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : darkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              Generar Pago
            </button>
            
            <button
              onClick={() => cambiarVista('historial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'historial' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : darkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <History className="w-4 h-4" />
              Historial
            </button>

            <button
              onClick={() => cambiarVista('personal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'personal' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : darkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Personal
            </button>

            <button
              onClick={() => cambiarVista('horario')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'horario' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : darkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Horario
            </button>

            <button
              onClick={() => cambiarVista('creditos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'creditos' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : darkMode ? 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Créditos
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de Alternancia para Modo Oscuro / Claro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-colors ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-amber-400 hover:bg-slate-600' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCerrarSesion}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
                darkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-950/50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal con Vistas Persistentes */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {cargando ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className={vistaActual === 'generar' ? 'block' : 'hidden'}>
              <FormularioPagos empleados={empleados} />
            </div>
            
            <div className={vistaActual === 'historial' ? 'block' : 'hidden'}>
              <HistorialPagos />
            </div>

            <div className={vistaActual === 'personal' ? 'block' : 'hidden'}>
              <GestionEmpleados empleados={empleados} onEmpleadoAgregado={obtenerEmpleados} />
            </div>

            <div className={vistaActual === 'creditos' ? 'block' : 'hidden'}>
              <GestionCreditos />
            </div>

            <div className={vistaActual === 'horario' ? 'block' : 'hidden'}>
              <ControlTurnos />
            </div>
          </>
        )}
      </main>
    </div>
  );
}