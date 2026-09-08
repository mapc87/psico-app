import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { BrainCircuit } from 'lucide-react';

export default function SalaPaciente() {
  const { roomId } = useParams<{ roomId: string }>();
  const [hasJoined, setHasJoined] = useState(false);

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
      <div className="flex-1 w-full bg-black relative">
        {!hasJoined && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-violet-400 font-medium">Conectando a la sala virtual...</p>
            </div>
          </div>
        )}
        
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`psicoapp-videoconsulta-${roomId}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: false,
            enableEmailInStats: false,
            prejoinPageEnabled: true // Que el paciente pueda configurar su cámara antes de entrar
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'settings',
              'videoquality', 'filmstrip', 'tileview'
            ]
          }}
          userInfo={{
            displayName: 'Paciente'
          }}
          onApiReady={(externalApi) => {
            // Se disparará cuando la API cargue
            externalApi.addListener('videoConferenceJoined', () => {
              setHasJoined(true);
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
}
