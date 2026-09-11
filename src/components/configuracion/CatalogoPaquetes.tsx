import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import type { PaqueteSesion } from '../../types';

export default function CatalogoPaquetes() {
  const { usuarioActual } = useAuth();
  const [paquetes, setPaquetes] = useState<PaqueteSesion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [numSesiones, setNumSesiones] = useState<number>(5);
  const [precio, setPrecio] = useState<number>(1000);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    fetchPaquetes();
  }, [usuarioActual]);

  const fetchPaquetes = async () => {
    if (!usuarioActual?.clinica_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('paquetes_sesiones')
      .select('*')
      .eq('clinica_id', usuarioActual.clinica_id)
      .order('created_at', { ascending: false });
      
    if (data) setPaquetes(data as PaqueteSesion[]);
    setLoading(false);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setNombre('');
    setNumSesiones(5);
    setPrecio(1000);
    setActivo(true);
    setIsFormOpen(true);
  };

  const handleEdit = (p: PaqueteSesion) => {
    setEditingId(p.id);
    setNombre(p.nombre);
    setNumSesiones(p.num_sesiones);
    setPrecio(p.precio);
    setActivo(p.activo);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este paquete?')) return;
    const { error } = await supabase.from('paquetes_sesiones').delete().eq('id', id);
    if (!error) {
      setPaquetes(paquetes.filter(p => p.id !== id));
    } else {
      alert('Error al eliminar paquete. Es posible que ya esté en uso por pacientes.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioActual?.clinica_id) return;

    const payload = {
      clinica_id: usuarioActual.clinica_id,
      nombre,
      num_sesiones: numSesiones,
      precio,
      activo
    };

    if (editingId) {
      const { data, error } = await supabase.from('paquetes_sesiones').update(payload).eq('id', editingId).select().single();
      if (!error && data) {
        setPaquetes(paquetes.map(p => p.id === editingId ? data : p));
        setIsFormOpen(false);
      }
    } else {
      const { data, error } = await supabase.from('paquetes_sesiones').insert([payload]).select().single();
      if (!error && data) {
        setPaquetes([data, ...paquetes]);
        setIsFormOpen(false);
      }
    }
  };

  if (loading) return <div className="p-4 text-slate-500">Cargando paquetes...</div>;

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Package className="mr-2 text-violet-500" />
            Catálogo de Paquetes de Sesiones
          </h3>
          <p className="text-sm text-slate-500 mt-1">Crea bonos de múltiples sesiones para vender a tus pacientes con descuento.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={handleOpenNew}
            className="flex items-center px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            <Plus size={16} className="mr-2" />
            Nuevo Paquete
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Paquete</label>
              <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Paquete TCC Intensivo 5 Sesiones" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Número de Sesiones</label>
              <input required type="number" min="1" value={numSesiones} onChange={e => setNumSesiones(parseInt(e.target.value))} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Precio Total (Q.)</label>
              <input required type="number" step="0.01" min="0" value={precio} onChange={e => setPrecio(parseFloat(e.target.value))} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="md:col-span-2 flex items-center mt-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={activo} onChange={e => setActivo(e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${activo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${activo ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-bold text-slate-700">Paquete Activo (Visible para la venta)</div>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-lg hover:bg-violet-700 cursor-pointer">Guardar Paquete</button>
          </div>
        </form>
      )}

      {paquetes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paquetes.map(p => (
            <div key={p.id} className={`p-5 rounded-2xl border ${p.activo ? 'border-violet-100 bg-violet-50/30' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{p.nombre}</h4>
                  <p className="text-sm text-slate-500 mt-1">{p.num_sesiones} Sesiones incluidas</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {p.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div className="text-2xl font-black text-violet-700">
                  Q. {p.precio.toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aún no has configurado paquetes de sesiones.</p>
        </div>
      )}
    </div>
  );
}
