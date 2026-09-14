import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BrainCircuit, Video } from 'lucide-react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export default function SalaPaciente() {
  const { roomId } = useParams<{ roomId: string }>();
  const [hasJoined, setHasJoined] = useState(false);
  const [pacienteNombre, setPacienteNombre] = useState('');

  if (!roomId) return <div>Sala no válida</div>;

  const myMeeting = async (element: HTMLDivElement | null) => {
    if (!element) return;
    const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || '';
    
    if (!appID || !serverSecret) {
      console.error("ZegoCloud credentials missing");
      element.innerHTML = '<div class="text-white p-4">Error de configuración de servidor</div>';
      return;
    }

    // Generate a random ID for the patient
    const userID = Math.floor(Math.random() * 10000).toString();

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, 
      serverSecret, 
      roomId, 
      userID, 
      pacienteNombre || "Paciente"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    
    zp.joinRoom({
        container: element,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showRoomTimer: true,
        showPreJoinView: false,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col">
      {/* Header Minimalista */}
      <div className="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center z-10">
        <div className="flex items-center">
          <BrainCircuit className="text-violet-400 mr-2" size={28} />
          <h1 className="text-xl font-bold text-white tracking-tight">PsicoApp Telemedicina</h1>
        </div>
        <div className="text-slate-300 text-sm font-medium">
          Sala Segura
        </div>
      </div>

      {/* Área de Video */}
      <div className="flex-1 w-full bg-slate-900 flex items-center justify-center relative">
        {!hasJoined ? (
          <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 text-center">
             <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="text-violet-400" size={32} />
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Unirse a la Consulta</h2>
             <p className="text-slate-400 mb-6 text-sm">Ingresa tu nombre para entrar a la sala virtual con tu médico.</p>
             
             <input 
               type="text" 
               placeholder="Tu Nombre" 
               value={pacienteNombre}
               onChange={(e) => setPacienteNombre(e.target.value)}
               className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-violet-500"
             />
             
             <button 
               onClick={() => setHasJoined(true)}
               disabled={!pacienteNombre.trim()}
               className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-colors flex justify-center items-center"
             >
               Entrar a la Sala
             </button>
          </div>
        ) : (
          <div ref={myMeeting} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
