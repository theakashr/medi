import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { Layout } from './components/Layout';

// Pages (to be implemented)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">MediCart Loading...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <LoadingFallback />;

  return (
    <BrowserRouter>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />} 
          />
          
          <Route
            path="/"
            element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />}
          />
          
          <Route
            path="/inventory"
            element={user ? <Layout><Inventory /></Layout> : <Navigate to="/login" />}
          />
          
          <Route
            path="/billing"
            element={user ? <Layout><Billing /></Layout> : <Navigate to="/login" />}
          />
          
          <Route
            path="/customers"
            element={user ? <Layout><Customers /></Layout> : <Navigate to="/login" />}
          />
          
          <Route
            path="/reports"
            element={user ? <Layout><Reports /></Layout> : <Navigate to="/login" />}
          />
          
          <Route
            path="/settings"
            element={user ? <Layout><Settings /></Layout> : <Navigate to="/login" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
