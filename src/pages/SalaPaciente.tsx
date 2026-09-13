import React from 'react';
import { useParams } from 'react-router-dom';
import { BrainCircuit, Video } from 'lucide-react';

export default function SalaPaciente() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId) return <div>Sala no válida</div>;

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col">
      {/* Header Minimalista */}
      <div className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <BrainCircuit className="text-violet-400 mr-2" size={28} />
          <h1 className="text-xl font-bold text-white tracking-tight">PsicoApp Telemedicina</h1>
        </div>
        <div className="text-slate-300 text-sm font-medium">
          Sala Segura: {roomId.slice(0, 8)}...
        </div>
      </div>

      {/* Área de Video */}
      <div className="flex-1 w-full bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center justify-center p-8 text-center border border-slate-800">
          <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-700">
            <Video className="text-blue-500" size={48} />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Videoconsulta Lista</h2>
          
          <p className="text-slate-400 max-w-lg mb-10 text-lg leading-relaxed">
            Para garantizar la mejor calidad de conexión y evitar interrupciones, la videollamada se abrirá en una ventana segura de forma externa.
          </p>
          
          <button 
            onClick={() => window.open(`https://meet.jit.si/psicoapp-videoconsulta-${roomId}`, 'JitsiVideo', 'width=1024,height=768')}
            className="flex items-center px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-2xl transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1"
          >
            <Video className="mr-3" size={28} />
            Unirse a la Videollamada
          </button>
        </div>
      </div>
    </div>
  );
}
