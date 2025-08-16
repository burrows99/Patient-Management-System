import React from 'react';
import { AuthProvider } from 'react-oidc-context';
import oidcConfig from './oidcConfig';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginButton from './LoginButton';
import Callback from './Callback';
import AuthStatus from './AuthStatus';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import TriageSimulatorPage from './pages/TriageSimulatorPage';
import DataExplorersPage from './pages/DataExplorersPage';
import DataExplorerDetailPage from './pages/DataExplorerDetailPage';

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <div className="nhsuk-grid-row">
                <div className="nhsuk-grid-column-three-quarters">
                  <h1 className="nhsuk-heading-xl">Welcome to NHS MOA Triage</h1>
                  <p className="nhsuk-body-l">Use the sign-in button below to access the triage system.</p>
                  <div className="nhsuk-action-link">
                    <LoginButton />
                  </div>
                  <AuthStatus />
                  <div className="nhsuk-inset-text">
                    <span className="nhsuk-u-visually-hidden">Information: </span>
                    <p>This system helps healthcare professionals manage patient triage efficiently and securely.</p>
                  </div>
                </div>
              </div>
            }
          />

          {/* OIDC callback must remain public */}
          <Route path="/callback" element={<Callback />} />

          {/* Protected routes */}
          <Route
            path="/triage-simulator"
            element={
              <ProtectedRoute>
                <TriageSimulatorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-explorers"
            element={
              <ProtectedRoute>
                <DataExplorersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-explorers/:id"
            element={
              <ProtectedRoute>
                <DataExplorerDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
