import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Loader from './components/Loader.jsx';

// Lazy-load pages to keep initial bundle small
const Home       = lazy(() => import('./pages/Home.jsx'));
const Login      = lazy(() => import('./pages/Login.jsx'));
const Register   = lazy(() => import('./pages/Register.jsx'));
const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'));
const Profile    = lazy(() => import('./pages/Profile.jsx'));
const InvitePage = lazy(() => import('./pages/InvitePage.jsx'));

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/invite/:token" element={<InvitePage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
    </AuthProvider>
  );
}

export default App;
