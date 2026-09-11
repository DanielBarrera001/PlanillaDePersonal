import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Wallet, UserPlus, DollarSign, PlusCircle, Trash2, ChevronDown, ChevronUp, Users, FileText, History } from 'lucide-react';

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
  const [adelantosList, setAdelantosList] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [montoAdelantoEmp, setMontoAdelantoEmp] = useState('');
  const [motivoAdelanto, setMotivoAdelanto] = useState('');

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
      .select('*, empleados(nombre_completo)')
      .eq('monto_bruto', 0)
      .gt('adelanto_salario', 0)
      .order('fecha_pago', { ascending: false });
    if (resAdelantos) setAdelantosList(resAdelantos);

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

  const handleRegistrarAdelantoEmpleado = async (e) => {
    e.preventDefault();
    if (!empleadoSeleccionado || !montoAdelantoEmp) return;

    const { error } = await supabase.from('pagos_registro').insert([{
      empleado_id: empleadoSeleccionado,
      tipo_pago: 'quincena', 
      fecha_pago: new Date().toISOString().split('T')[0],
      monto_bruto: 0,
      adelanto_salario: parseFloat(montoAdelantoEmp),
      monto_neto: -parseFloat(montoAdelantoEmp),
      observaciones: motivoAdelanto || 'Adelanto de salario / Préstamo'
    }]);

    if (error) {
      alert('Error al registrar adelanto: ' + error.message);
    } else {
      alert('Adelanto registrado exitosamente. Se descontará en el próximo cálculo de planilla.');
      setMontoAdelantoEmp('');
      setMotivoAdelanto('');
      setEmpleadoSeleccionado('');
      cargarDatos();
    }
  };

  const handleEliminarAdelanto = async (id) => {
    if (!confirm('¿Deseas eliminar este registro de adelanto?')) return;
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex bg-slate-200 p-1 rounded-xl max-w-md mx-auto">
        <button
          onClick={() => setPestanaActiva('clientes')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'clientes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" /> Cuentas de Clientes (Fiados)
        </button>
        <button
          onClick={() => setPestanaActiva('empleados')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            pestanaActiva === 'empleados' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Adelantos de Planilla
        </button>
      </div>

      {pestanaActiva === 'clientes' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" /> Nuevo Cliente de Crédito
              </h3>
              <form onSubmit={handleCrearCliente} className="space-y-3">
                <input
                  type="text" placeholder="Nombre del cliente" value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text" placeholder="Teléfono (opcional)" value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="submit" className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900">
                  Guardar Cliente
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" /> Otorgar Nuevo Crédito
              </h3>
              <form onSubmit={handleCrearCredito} className="space-y-3">
                <select
                  value={clienteSeleccionado} onChange={(e) => setClienteSeleccionado(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                </select>
                <input
                  type="text" placeholder="Concepto (ej. Impresiones)" value={concepto}
                  onChange={(e) => setConcepto(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="number" step="0.01" placeholder="Monto total ($)" value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)} required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700">
                  Registrar Crédito
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Cuentas por Cliente
            </h3>
            {cuentasPorCliente.length > 0 ? (
              <div className="space-y-4">
                {cuentasPorCliente.map((cliente) => {
                  const estaExpandido = clientesExpandidos[cliente.id];
                  return (
                    <div key={cliente.id} className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
                      <div onClick={() => toggleExpandir(cliente.id)} className="p-5 flex justify-between items-center bg-slate-50 hover:bg-slate-100 cursor-pointer">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">{cliente.nombre}</h4>
                          <p className="text-xs text-slate-500">{cliente.creditos.length} créditos registrados</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Saldo Pendiente</p>
                            <p className="text-base font-extrabold text-emerald-700">${cliente.saldoPendienteCliente.toFixed(2)}</p>
                          </div>
                          {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {estaExpandido && (
                        <div className="p-5 space-y-4 border-t border-slate-100 bg-white">
                          {cliente.creditos.map((cuenta) => {
                            const totalAbonado = (cuenta.creditos_abonos || []).reduce((acc, curr) => acc + Number(curr.monto_abono || 0), 0);
                            const saldoPendiente = Math.max(0, Number(cuenta.monto_total) - totalAbonado);
                            return (
                              <div key={cuenta.id} className="p-4 rounded-xl border bg-slate-50">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-bold text-slate-800">{cuenta.concepto}</p>
                                  <p className="text-xs font-bold text-emerald-700">Saldo: ${saldoPendiente.toFixed(2)}</p>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  {cuentaActivaAbono === cuenta.id ? (
                                    <form onSubmit={(e) => handleRegistrarAbono(e, cuenta.id, saldoPendiente)} className="flex gap-2">
                                      <input
                                        type="number" step="0.01" placeholder="Monto" value={montoAbono}
                                        onChange={(e) => setMontoAbono(e.target.value)} className="p-1 text-xs border rounded-lg w-24"
                                      />
                                      <button type="submit" className="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold">OK</button>
                                      <button type="button" onClick={() => setCuentaActivaAbono(null)} className="text-xs">X</button>
                                    </form>
                                  ) : (
                                    <button onClick={() => setCuentaActivaAbono(cuenta.id)} className="text-xs text-emerald-700 font-bold flex items-center gap-1">
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
            ) : <p className="text-center text-slate-400 py-6">No hay créditos de clientes registrados.</p>}
          </div>
        </div>
      )}

      {pestanaActiva === 'empleados' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" /> Registro de Adelantos y Préstamos a Empleados
            </h3>
            <p className="text-sm text-slate-500">
              Cualquier adelanto registrado aquí quedará vinculado automáticamente para restarse al momento de procesar el pago de planilla del colaborador.
            </p>

            <form onSubmit={handleRegistrarAdelantoEmpleado} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} required
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="">Seleccionar Empleado...</option>
                  {empleados.map((emp) => (<option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto del Adelanto ($)</label>
                <input
                  type="number" step="0.01" placeholder="0.00" value={montoAdelantoEmp}
                  onChange={(e) => setMontoAdelantoEmp(e.target.value)} required
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo / Observación</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Ej. Emergencia familiar" value={motivoAdelanto}
                    onChange={(e) => setMotivoAdelanto(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                  />
                  <button type="submit" className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 whitespace-nowrap">
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" /> Historial de Adelantos Activos
            </h3>
            {adelantosList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Colaborador</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3 text-right">Monto Adelantado</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adelantosList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600">{item.fecha_pago}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.empleados?.nombre_completo || 'Desconocido'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.observaciones || '-'}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-rose-600">${Number(item.adelanto_salario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleEliminarAdelanto(item.id)} className="text-rose-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-6">No hay adelantos o préstamos registrados para empleados.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};