import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { FormularioPagos } from './components/FormularioPagos';
import { HistorialPagos } from './components/HistorialPagos';
import { GestionEmpleados } from './components/GestionEmpleados';
import { GestionCreditos } from './components/GestionCreditos';
import { Login } from './components/Login';
import { LogOut, FilePlus, History, Users, CreditCard } from 'lucide-react';

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('vista_actual') || 'generar';
  });

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

    // Escuchar cambios críticos de autenticación (ignora refrescos de token en segundo plano)
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
    <div className="min-h-screen bg-slate-50">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
              R
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Centro de Copias La Ranita</h1>
              <p className="text-xs text-slate-500 font-medium">{sesion.user.email}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => cambiarVista('generar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'generar' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
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
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
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
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Personal
            </button>

            <button
              onClick={() => cambiarVista('creditos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                vistaActual === 'creditos' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Créditos
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
          </>
        )}
      </main>
    </div>
  );
}