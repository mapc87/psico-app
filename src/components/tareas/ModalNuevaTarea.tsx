import React, { useState } from 'react';
import { X, ClipboardList } from 'lucide-react';

interface ModalNuevaTareaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (titulo: string, descripcion: string) => Promise<void>;
}

export default function ModalNuevaTarea({ isOpen, onClose, onSave }: ModalNuevaTareaProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave(titulo, descripcion);
      setTitulo('');
      setDescripcion('');
      onClose();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Error al asignar tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <ClipboardList className="mr-2 text-violet-600" size={24} />
            Asignar Tarea
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Título de la tarea <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
              placeholder="Ej: Diario de emociones, Ejercicio de relajación..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Descripción / Instrucciones</label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors resize-none"
              placeholder="Detalla las instrucciones para el paciente..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Asignando...' : 'Asignar Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
