import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Agenda from './pages/Agenda';
import NuevoPaciente from './pages/NuevoPaciente';
import EditarPaciente from './pages/EditarPaciente';
import PacienteDetalle from './pages/PacienteDetalle';
import Consentimientos from './pages/Consentimientos';
import FirmaRemota from './pages/FirmaRemota';
import EvaluacionRemota from './pages/EvaluacionRemota';
import FinanzasGlobal from './pages/FinanzasGlobal';
import Login from './pages/Login';
import RegistroInicial from './pages/RegistroInicial';
import CrearUsuario from './pages/CrearUsuario';
import Roles from './pages/Roles';
import Personal from './pages/Personal';
import Perfil from './pages/Perfil';
import MantenimientoClinicas from './pages/MantenimientoClinicas';
import ConfiguracionClinica from './pages/ConfiguracionClinica';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import RegistroInvitado from './pages/RegistroInvitado';
import SalaPaciente from './pages/SalaPaciente';
import SalaVirtual from './pages/SalaVirtual';
import GestorPruebas from './pages/GestorPruebas';
import Paquetes from './pages/Paquetes';

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro-inicial" element={<RegistroInicial />} />
      <Route path="/registro" element={<RegistroInvitado />} />
      <Route path="/firmar/:id" element={<FirmaRemota />} />
      <Route path="/evaluacion/:id" element={<EvaluacionRemota />} />
      <Route path="/sala-virtual/:roomId" element={<SalaPaciente />} />

      {/* Rutas Privadas (Protegidas) */}
      <Route element={<ProtectedRoute />}>
        {/* Sala Virtual fuera del layout principal para ocupar pantalla completa */}
        <Route path="/videoconsulta/:citaId" element={<SalaVirtual />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<NuevoPaciente />} />
          <Route path="/pacientes/:id/editar" element={<EditarPaciente />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/consentimientos" element={<Consentimientos />} />
          <Route path="/finanzas" element={<FinanzasGlobal />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/pruebas" element={<GestorPruebas />} />
          <Route path="/paquetes" element={<Paquetes />} />
          
          {/* Rutas Privadas solo para Administradores */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/usuarios" element={<CrearUsuario />} />
            <Route path="/admin/clinicas" element={<MantenimientoClinicas />} />
            <Route path="/configuracion" element={<ConfiguracionClinica />} />
          </Route>
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
