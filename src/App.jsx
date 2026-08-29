import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { FormularioPagos } from './components/FormularioPagos';

export default function App() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerEmpleados = async () => {
      const { data, error } = await supabase.from('empleados').select('*').order('nombre_completo');
      if (!error && data) {
        setEmpleados(data);
      }
      setCargando(false);
    };

    obtenerEmpleados();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Planilla - Centro de Copias La Rana</h1>
        <p className="text-slate-600 mt-2">Gestión de recibos, prestaciones y pagos por servicios</p>
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