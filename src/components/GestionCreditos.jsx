import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Wallet, UserPlus, DollarSign, PlusCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export const GestionCreditos = () => {
  const [clientes, setClientes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para nuevo cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  // Estados para nueva cuenta / crédito
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [concepto, setConcepto] = useState('');
  const [montoTotal, setMontoTotal] = useState('');

  // Estado para registrar abono
  const [cuentaActivaAbono, setCuentaActivaAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');

  // Control de acordeón: almacena los IDs de los clientes expandidos
  const [clientesExpandidos, setClientesExpandidos] = useState({});

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
    setCargando(false);
  };

  const toggleExpandir = (clienteId) => {
    setClientesExpandidos(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!nombreCliente.trim()) return;

    const { error } = await supabase.from('clientes_credito').insert([{ nombre: nombreCliente, telefono: telefonoCliente }]);
    if (error) {
      alert('Error al registrar cliente: ' + error.message);
    } else {
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

    if (error) {
      alert('Error al registrar crédito: ' + error.message);
    } else {
      setConcepto('');
      setMontoTotal('');
      setClienteSeleccionado('');
      // Auto-expandir el cliente al agregarle un crédito
      setClientesExpandidos(prev => ({ ...prev, [clienteSeleccionado]: true }));
      cargarDatos();
    }
  };

  const handleRegistrarAbono = async (e, creditoId, saldoRestante) => {
    e.preventDefault();
    const abonoNum = parseFloat(montoAbono);
    if (isNaN(abonoNum) || abonoNum <= 0) return;

    if (abonoNum > saldoRestante) {
      alert('El abono no puede ser mayor al saldo pendiente.');
      return;
    }

    const { error } = await supabase.from('creditos_abonos').insert([{
      credito_id: creditoId,
      monto_abono: abonoNum
    }]);

    if (error) {
      alert('Error al registrar abono: ' + error.message);
    } else {
      if (abonoNum === saldoRestante) {
        await supabase.from('creditos_cuentas').update({ estado: 'pagado' }).eq('id', creditoId);
      }
      setMontoAbono('');
      setCuentaActivaAbono(null);
      cargarDatos();
    }
  };

  const handleEliminarCuenta = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este registro de crédito?')) return;
    const { error } = await supabase.from('creditos_cuentas').delete().eq('id', id);
    if (!error) cargarDatos();
  };

  // Agrupar cuentas por cliente
  const cuentasPorCliente = clientes.map(cliente => {
    const creditosCliente = cuentas.filter(c => c.cliente_id === cliente.id);
    
    // Calcular deuda total y saldo pendiente general del cliente
    let deudaTotalCliente = 0;
    let saldoPendienteCliente = 0;

    creditosCliente.forEach(cuenta => {
      const totalAbonado = (cuenta.creditos_abonos || []).reduce((acc, curr) => acc + Number(curr.monto_abono || 0), 0);
      const saldoCuenta = Math.max(0, Number(cuenta.monto_total) - totalAbonado);
      
      deudaTotalCliente += Number(cuenta.monto_total);
      if (cuenta.estado !== 'pagado') {
        saldoPendienteCliente += saldoCuenta;
      }
    });

    return {
      ...cliente,
      creditos: creditosCliente,
      deudaTotalCliente,
      saldoPendienteCliente,
      tienePendientes: saldoPendienteCliente > 0
    };
  }).filter(c => c.creditos.length > 0); // Mostrar solo clientes que tengan créditos registrados

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Formularios de Registro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Registrar Cliente */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Nuevo Cliente de Crédito
          </h3>
          <form onSubmit={handleCrearCliente} className="space-y-3">
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Teléfono (opcional)"
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors">
              Guardar Cliente
            </button>
          </form>
        </div>

        {/* Asignar Crédito / Fiado */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Otorgar Nuevo Crédito
          </h3>
          <form onSubmit={handleCrearCredito} className="space-y-3">
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar Cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Concepto (ej. Impresiones a color)"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Monto total ($)"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors">
              Registrar Crédito
            </button>
          </form>
        </div>

      </div>

      {/* Listado Agrupado por Cliente */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Cuentas por Cliente
        </h3>

        {cargando ? (
          <p className="text-center text-slate-400 py-6">Cargando créditos...</p>
        ) : cuentasPorCliente.length > 0 ? (
          <div className="space-y-4">
            {cuentasPorCliente.map((cliente) => {
              const estaExpandido = clientesExpandidos[cliente.id];

              return (
                <div key={cliente.id} className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden transition-all">
                  
                  {/* Cabecera del Cliente (Siempre visible con resumen) */}
                  <div 
                    onClick={() => toggleExpandir(cliente.id)}
                    className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/70 hover:bg-slate-50 cursor-pointer select-none"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        {cliente.nombre}
                        {cliente.telefono && <span className="text-xs font-normal text-slate-400">({cliente.telefono})</span>}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cliente.creditos.length} {cliente.creditos.length === 1 ? 'crédito registrado' : 'créditos registrados'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Saldo Pendiente</p>
                        <p className="text-base font-extrabold text-emerald-700">${cliente.saldoPendienteCliente.toFixed(2)}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        cliente.saldoPendienteCliente > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {cliente.saldoPendienteCliente > 0 ? 'Con Deuda' : 'Saldado'}
                      </span>

                      <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                        {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Expandible de los Pedidos / Créditos del Cliente */}
                  {estaExpandido && (
                    <div className="p-5 space-y-4 border-t border-slate-100 bg-white">
                      {cliente.creditos.map((cuenta) => {
                        const totalAbonado = (cuenta.creditos_abonos || []).reduce((acc, curr) => acc + Number(curr.monto_abono || 0), 0);
                        const saldoPendiente = Math.max(0, Number(cuenta.monto_total) - totalAbonado);
                        const estaPagado = saldoPendiente <= 0 || cuenta.estado === 'pagado';

                        return (
                          <div key={cuenta.id} className={`p-4 rounded-xl border ${estaPagado ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-slate-50/50 border-emerald-100'}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{cuenta.concepto}</p>
                                <p className="text-[11px] text-slate-400">Fecha: {cuenta.fecha}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right text-xs">
                                  <span className="text-slate-400">Total: ${Number(cuenta.monto_total).toFixed(2)}</span>
                                  <span className="mx-2 text-slate-300">|</span>
                                  <span className="font-bold text-emerald-700">Saldo: ${saldoPendiente.toFixed(2)}</span>
                                </div>
                                <button onClick={() => handleEliminarCuenta(cuenta.id)} className="text-rose-400 hover:text-rose-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Abonos específicos de este crédito */}
                            {!estaPagado && (
                              <div className="mt-3 pt-2 border-t border-slate-200/60">
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                  <span className="text-[11px] font-bold text-slate-600">Abonos a este pedido:</span>
                                  {cuentaActivaAbono === cuenta.id ? (
                                    <form onSubmit={(e) => handleRegistrarAbono(e, cuenta.id, saldoPendiente)} className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Monto"
                                        value={montoAbono}
                                        onChange={(e) => setMontoAbono(e.target.value)}
                                        autoFocus
                                        className="p-1 text-xs bg-white border border-slate-200 rounded-lg outline-none w-24"
                                      />
                                      <button type="submit" className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold">OK</button>
                                      <button type="button" onClick={() => setCuentaActivaAbono(null)} className="text-slate-400 text-xs font-bold">X</button>
                                    </form>
                                  ) : (
                                    <button
                                      onClick={() => setCuentaActivaAbono(cuenta.id)}
                                      className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                                    >
                                      <PlusCircle className="w-3 h-3" /> Registrar Abono
                                    </button>
                                  )}
                                </div>

                                {cuenta.creditos_abonos?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {cuenta.creditos_abonos.map((abono) => (
                                      <span key={abono.id} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                                        <strong>${Number(abono.monto_abono).toFixed(2)}</strong> <span className="text-slate-400">({abono.fecha})</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">No hay créditos registrados.</p>
        )}
      </div>
    </div>
  );
};