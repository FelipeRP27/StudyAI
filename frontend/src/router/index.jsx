import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import MateriaPage from '../pages/MateriaPage';
import ConteudoPage from '../pages/ConteudoPage';
import QuestoesPage from '../pages/QuestoesPage';
import FlashcardsPage from '../pages/FlashcardsPage';
import DesempenhoPage from '../pages/DesempenhoPage';
import TarefasPage from '../pages/TarefasPage';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materias/:materiaId"
        element={
          <ProtectedRoute>
            <MateriaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conteudos/:conteudoId"
        element={
          <ProtectedRoute>
            <ConteudoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conteudos/:conteudoId/questoes"
        element={
          <ProtectedRoute>
            <QuestoesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conteudos/:conteudoId/flashcards"
        element={
          <ProtectedRoute>
            <FlashcardsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/desempenho"
        element={
          <ProtectedRoute>
            <DesempenhoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tarefas"
        element={
          <ProtectedRoute>
            <TarefasPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
