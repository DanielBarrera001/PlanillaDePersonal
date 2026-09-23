import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Wallet, UserPlus, DollarSign, PlusCircle, Trash2, ChevronDown, ChevronUp, Users, FileText, History, CheckCircle2, ArrowRight, UserCheck } from 'lucide-react';

export const GestionCreditos = () => {
  const [pestanaActiva, setPestanaActiva] = useState('clientes');
  
  const [clientes, setClientes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [concepto, setConcepto] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [cuentaActivaAbono, setCuentaActivaAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [clientesExpandidos, setClientesExpandidos] = useState({});

  const [empleados, setEmpleados] = useState([]);
  const [historialAdelantos, setHistorialAdelantos] = useState([]);
  const [historialCreditos, setHistorialCreditos] = useState([]);
  const [saldosCreditos, setSaldosCreditos] = useState([]);
  
  const [empleadoAdelanto, setEmpleadoAdelanto] = useState('');
  const [montoAdelanto, setMontoAdelanto] = useState('');
  const [motivoAdelanto, setMotivoAdelanto] = useState('');

  const [empleadoCredito, setEmpleadoCredito] = useState('');
  const [montoCredito, setMontoCredito] = useState('');
  const [motivoCredito, setMotivoCredito] = useState('');

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    
    const { data: resClientes } = await supabase.from('clientes_credito').select('*').order('nombre');
    if (resClientes) setClientes(resClientes);

    const { data: resCuentas } = await supabase
      .from('creditos_cuentas')
      .select('*, clientes_credito(id, nombre), creditos_abonos(*)')
      .order('fecha', { ascending: false });
    if (resCuentas) setCuentas(resCuentas);

    const { data: resEmpleados } = await supabase.from('empleados').select('*').order('nombre_completo');
    if (resEmpleados) setEmpleados(resEmpleados);

    const { data: resAdelantos } = await supabase
      .from('pagos_registro')
      .select('*')
      .gt('adelanto_salario', 0)
      .eq('credito_otorgado', 0)
      .eq('monto_bruto', 0)
      .order('fecha_pago', { ascending: false });
    if (resAdelantos) setHistorialAdelantos(resAdelantos);

    const { data: resCreds } = await supabase
      .from('pagos_registro')
      .select('*')
      .gt('credito_otorgado', 0)
      .eq('monto_bruto', 0)
      .order('fecha_pago', { ascending: false });
    if (resCreds) setHistorialCreditos(resCreds);

    const { data: creditosData } = await supabase
      .from('pagos_registro')
      .select('empleado_id, credito_otorgado, descuento_credito');

    if (resEmpleados && creditosData) {
      const consolidado = resEmpleados.map(emp => {
        const transacciones = creditosData.filter(p => p.empleado_id === emp.id);
        const totalOtorgado = transacciones.reduce((acc, curr) => acc + Number(curr.credito_otorgado || 0), 0);
        const totalAbonado = transacciones.reduce((acc, curr) => acc + Number(curr.descuento_credito || 0), 0);

        return {
          ...emp,
          totalOtorgado,
          totalAbonado,
          saldoActual: Math.max(0, totalOtorgado - totalAbonado)
        };
      });
      setSaldosCreditos(consolidado.filter(e => e.saldoActual > 0 || e.totalOtorgado > 0));
    }

    setCargando(false);
  };

  const toggleExpandir = (clienteId) => {
    setClientesExpandidos(prev => ({ ...prev, [clienteId]: !prev[clienteId] }));
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!nombreCliente.trim()) return;
    const { error } = await supabase.from('clientes_credito').insert([{ nombre: nombreCliente, telefono: telefonoCliente }]);
    if (!error) {
      setNombreCliente('');
      setTelefonoCliente('');
      cargarDatos();
    }
  };

  const handleCrearCredito = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado || !concepto.trim() || !montoTotal) return;
    const { error } = await supabase.from('creditos_cuentas').insert([{
      cliente_id: clienteSeleccionado,
      concepto,
      monto_total: parseFloat(montoTotal),
      estado: 'pendiente'
    }]);
    if (!error) {
      setConcepto('');
      setMontoTotal('');
      setClienteSeleccionado('');
      cargarDatos();
    }
  };

  const handleRegistrarAbono = async (e, creditoId, saldoRestante) => {
    e.preventDefault();
    const abonoNum = parseFloat(montoAbono);
    if (isNaN(abonoNum) || abonoNum <= 0 || abonoNum > saldoRestante) return;

    const { error } = await supabase.from('creditos_abonos').insert([{ credito_id: creditoId, monto_abono: abonoNum }]);
    if (!error) {
      if (abonoNum === saldoRestante) {
        await supabase.from('creditos_cuentas').update({ estado: 'pagado' }).eq('id', creditoId);
      }
      setMontoAbono('');
      setCuentaActivaAbono(null);
      cargarDatos();
    }
  };

  const handleRegistrarAdelanto = async (e) => {
    e.preventDefault();
    if (!empleadoAdelanto || !montoAdelanto) {
      alert("Selecciona un empleado y digita un monto válido.");
      return;
    }

    const emp = empleados.find(e => String(e.id) === String(empleadoAdelanto));
    if (!emp) return;

    const { error } = await supabase.from('pagos_registro').insert([{
      empleado_id: emp.id,
      empleado_nombre: emp.nombre_completo,
      tipo_pago: 'adelanto',
      fecha_pago: new Date().toISOString().split('T')[0],
      monto_bruto: 0,
      adelanto_salario: parseFloat(montoAdelanto),
      credito_otorgado: 0,
      descuento_credito: 0,
      monto_neto: 0,
      observaciones: motivoAdelanto || 'Adelanto de salario'
    }]);

    if (error) {
      alert('Error al registrar adelanto: ' + error.message);
    } else {
      alert('Adelanto registrado exitosamente.');
      setMontoAdelanto('');
      setMotivoAdelanto('');
      setEmpleadoAdelanto('');
      cargarDatos();
    }
  };

  const handleRegistrarCreditoPlanilla = async (e) => {
    e.preventDefault();
    if (!empleadoCredito || !montoCredito) {
      alert("Selecciona un empleado y digita un monto válido.");
      return;
    }

    const emp = empleados.find(e => String(e.id) === String(empleadoCredito));
    if (!emp) return;

    const { error } = await supabase.from('pagos_registro').insert([{
      empleado_id: emp.id,
      empleado_nombre: emp.nombre_completo,
      tipo_pago: 'credito',
      fecha_pago: new Date().toISOString().split('T')[0],
      monto_bruto: 0,
      adelanto_salario: 0,
      credito_otorgado: parseFloat(montoCredito),
      descuento_credito: 0,
      monto_neto: 0,
      observaciones: motivoCredito || 'Crédito de personal para inversión'
    }]);

    if (error) {
      alert('Error al registrar crédito: ' + error.message);
    } else {
      alert('Crédito de planilla registrado exitosamente (admite abonos flexibles).');
      setMontoCredito('');
      setMotivoCredito('');
      setEmpleadoCredito('');
      cargarDatos();
    }
  };

  const handleEliminarOperacion = async (id) => {
    if (!confirm('¿Deseas eliminar este registro?')) return;
    const { error } = await supabase.from('pagos_registro').delete().eq('id', id);
    if (!error) {
      cargarDatos();
    }
  };

  const cuentasPorCliente = clientes.map(cliente => {
    const creditosCliente = cuentas.filter(c => c.cliente_id === cliente.id);
    let saldoPendienteCliente = 0;
    creditosCliente.forEach(cuenta => {
      const totalAbonado = (cuenta.creditos_abonos || []).reduce((acc, curr) => acc + Number(curr.monto_abono || 0), 0);
      const saldoCuenta = Math.max(0, Number(cuenta.monto_total) - totalAbonado);
      if (cuenta.estado !== 'pagado') saldoPendienteCliente += saldoCuenta;
    });
    return { ...cliente, creditos: creditosCliente, saldoPendienteCliente };
  }).filter(c => c.creditos.length > 0);

  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 px-4 sm:px-8 py-6 space-y-6">
      
      {/* Selector de Pestañas */}
      <div className="flex flex-wrap md:flex-nowrap bg-slate-200 dark:bg-slate-800 p-1 rounded-xl max-w-2xl mx-auto gap-1 transition-colors">
        <button
          onClick={() => setPestanaActiva('clientes')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'clientes' 
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4 hidden sm:block" /> Crédito Clientes
        </button>
        <button
          onClick={() => setPestanaActiva('adelantos')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'adelantos' 
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4 hidden sm:block" /> Adelantos Planilla
        </button>
        <button
          onClick={() => setPestanaActiva('creditos')}
          className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'creditos' 
              ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 hidden sm:block" /> Créditos Planilla
        </button>
      </div>

      {/* PESTAÑA 1: CRÉDITO CLIENTES */}
      {pestanaActiva === 'clientes' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Nuevo Cliente de Crédito
              </h3>
              <form onSubmit={handleCrearCliente} className="space-y-3">
                <input
                  type="text" placeholder="Nombre del cliente" value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <input
                  type="text" placeholder="Teléfono (opcional)" value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <button type="submit" className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-xs hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">
                  Guardar Cliente
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Otorgar Nuevo Crédito
              </h3>
              <form onSubmit={handleCrearCredito} className="space-y-3">
                <select
                  value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                </select>
                <input
                  type="text" placeholder="Concepto (ej. Impresiones)" value={concepto}
                  onChange={(e) => setConcepto(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <input
                  type="number" step="0.01" placeholder="Monto total ($)" value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors">
                  Registrar Crédito
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Cuentas por Cliente
            </h3>
            {cuentasPorCliente.length > 0 ? (
              <div className="space-y-4">
                {cuentasPorCliente.map((cliente) => {
                  const estaExpandido = clientesExpandidos[cliente.id];
                  return (
                    <div key={cliente.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50 shadow-xs overflow-hidden transition-colors">
                      <div onClick={() => toggleExpandir(cliente.id)} className="p-5 flex justify-between items-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">{cliente.nombre}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.creditos.length} créditos registrados</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400 dark:text-slate-500">Saldo Pendiente</p>
                            <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">${cliente.saldoPendienteCliente.toFixed(2)}</p>
                          </div>
                          {estaExpandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {estaExpandido && (
                        <div className="p-5 space-y-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors">
                          {cliente.creditos.map((cuenta) => {
                            const totalAbonado = (cuenta.creditos_abonos || []).reduce((acc, curr) => acc + Number(curr.monto_abono || 0), 0);
                            const saldoPendiente = Math.max(0, Number(cuenta.monto_total) - totalAbonado);
                            return (
                              <div key={cuenta.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{cuenta.concepto}</p>
                                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Saldo: ${saldoPendiente.toFixed(2)}</p>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  {cuentaActivaAbono === cuenta.id ? (
                                    <form onSubmit={(e) => handleRegistrarAbono(e, cuenta.id, saldoPendiente)} className="flex gap-2">
                                      <input
                                        type="number" step="0.01" placeholder="Monto" value={montoAbono}
                                        onChange={(e) => setMontoAbono(e.target.value)} 
                                        className="p-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg w-24 text-slate-900 dark:text-slate-200 outline-none"
                                      />
                                      <button type="submit" className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold">OK</button>
                                      <button type="button" onClick={() => setCuentaActivaAbono(null)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">X</button>
                                    </form>
                                  ) : (
                                    <button onClick={() => setCuentaActivaAbono(cuenta.id)} className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline">
                                      <PlusCircle className="w-3 h-3" /> Registrar Abono
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-slate-400 dark:text-slate-500 py-6">No hay créditos de clientes registrados.</p>}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ADELANTOS PLANILLA */}
      {pestanaActiva === 'adelantos' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Otorgar Adelanto de Salario
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registra un adelanto rápido. Este se descontará íntegro y de golpe en la próxima fecha de pago.
            </p>

            <form onSubmit={handleRegistrarAdelanto} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Colaborador</label>
                <select
                  value={empleadoAdelanto} onChange={(e) => setEmpleadoAdelanto(e.target.value)} required
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 outline-none transition-colors"
                >
                  <option value="">Seleccionar Empleado...</option>
                  {empleados.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto del Adelanto ($)</label>
                <input
                  type="number" step="0.01" placeholder="0.00" value={montoAdelanto}
                  onChange={(e) => setMontoAdelanto(e.target.value)} required
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo / Observación</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Ej. Emergencia rápida" value={motivoAdelanto}
                    onChange={(e) => setMotivoAdelanto(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none transition-colors"
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors">
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Historial de Adelantos Otorgados
            </h3>
            {historialAdelantos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 transition-colors">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3 text-right">Monto Adelantado</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                    {historialAdelantos.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.fecha_pago}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{item.empleado_nombre || 'Desconocido'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.observaciones || '-'}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-rose-600 dark:text-rose-400">${Number(item.adelanto_salario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleEliminarOperacion(item.id)} className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-6">No hay adelantos registrados.</p>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CRÉDITOS PLANILLA */}
      {pestanaActiva === 'creditos' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Otorgar Crédito
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registra un préstamo grande. Permite abonar cantidades flexibles y variables en cada fecha de pago.
            </p>

            <form onSubmit={handleRegistrarCreditoPlanilla} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Colaborador</label>
                <select
                  value={empleadoCredito} onChange={(e) => setEmpleadoCredito(e.target.value)} required
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 outline-none transition-colors"
                >
                  <option value="">Seleccionar Empleado...</option>
                  {empleados.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto del Crédito ($)</label>
                <input
                  type="number" step="0.01" placeholder="0.00" value={montoCredito}
                  onChange={(e) => setMontoCredito(e.target.value)} required
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Motivo / Observación</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Ej. Préstamo para inversión" value={motivoCredito}
                    onChange={(e) => setMotivoCredito(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 dark:placeholder-slate-500 outline-none transition-colors"
                  />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors">
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-500" /> Saldos Activos de Créditos de Planilla
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cálculo en tiempo real: Total otorgado en créditos MENOS los abonos aplicados en recibos.</p>
            </div>

            {cargando ? (
              <div className="text-center text-emerald-600 dark:text-emerald-400 py-8">Calculando saldos financieros...</div>
            ) : saldosCreditos.length > 0 ? (
              <div className="space-y-3">
                {saldosCreditos.map(emp => (
                  <div key={emp.id} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{emp.nombre_completo}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span>Total Créditos: <strong className="text-slate-700 dark:text-slate-300">${emp.totalOtorgado.toFixed(2)}</strong></span>
                        <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 hidden sm:block" />
                        <span>Abonado en Planillas: <strong className="text-emerald-600 dark:text-emerald-400">${emp.totalAbonado.toFixed(2)}</strong></span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm min-w-[150px] transition-colors">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Deuda Vigente</p>
                      {emp.saldoActual > 0 ? (
                        <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">${emp.saldoActual.toFixed(2)}</p>
                      ) : (
                        <div className="flex items-center sm:justify-end gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-bold text-lg">Saldado</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                Ningún colaborador tiene saldo pendiente por créditos de planilla.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};