import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Agenda from './pages/Agenda';
import NuevoPaciente from './pages/NuevoPaciente';
import PacienteDetalle from './pages/PacienteDetalle';
import Login from './pages/Login';
import RegistroInicial from './pages/RegistroInicial';
import CrearUsuario from './pages/CrearUsuario';
import Roles from './pages/Roles';
import Personal from './pages/Personal';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro-inicial" element={<RegistroInicial />} />

      {/* Rutas Privadas (Protegidas) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/pacientes/nuevo" element={<NuevoPaciente />} />
          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/personal" element={<Personal />} />
          
          {/* Rutas Privadas solo para Administradores */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/usuarios" element={<CrearUsuario />} />
          </Route>
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
