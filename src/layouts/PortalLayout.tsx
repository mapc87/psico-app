import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { LogOut, UserCircle } from 'lucide-react';

export default function PortalLayout() {
  const navigate = useNavigate();
  // Check if patient is logged in (using localStorage for simplicity of PIN auth)
  const patientDataStr = localStorage.getItem('portalPaciente');
  
  if (!patientDataStr) {
    return <Navigate to="/portal/login" replace />;
  }

  const patient = JSON.parse(patientDataStr);

  const handleLogout = () => {
    localStorage.removeItem('portalPaciente');
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Portal del Paciente
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-slate-600">
                <UserCircle size={20} className="mr-2 text-violet-500" />
                <span className="text-sm font-medium">{patient.nombre}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} PsicoApp - Portal del Paciente.</p>
      </footer>
    </div>
  );
}
