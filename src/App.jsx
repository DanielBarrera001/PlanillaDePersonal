import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { FormularioPagos } from './components/FormularioPagos';
import { Login } from './components/Login';
import { LogOut } from 'lucide-react';

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Verificar si hay una sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
      if (session) obtenerEmpleados();
      else setCargando(false);
    });

    // 2. Escuchar cambios de autenticación (Login/Logout)
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
      <header className="max-w-2xl mx-auto mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Centro de Copias La Rana</h1>
          <p className="text-xs text-slate-500">{sesion.user.email}</p>
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
          <p className="text-center text-gray-500">Cargando colaboradores...</p>
        ) : (
          <FormularioPagos empleados={empleados} />
        )}
      </main>
    </div>
  );
}