import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from "./context/AppContext";
import { Loader2 } from "lucide-react";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Chat from "./pages/Chat";
import Booking from "./pages/Booking";
import Matches from "./pages/Matches";
import Friends from "./pages/Friends";
import Reviews from "./pages/Reviews";
import Help from "./pages/Help";
import VideoCall from "./pages/VideoCall";
import AdminPanel from "./pages/AdminPanel";
import VerifyEmail from "./pages/VerifyEmail";

// Inner component to consume context
function AppContent() {
  const { state } = useApp();

  if (state.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-ink-muted" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/video/:sessionId" element={<VideoCall />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-border)',
              fontFamily: 'DM Sans, sans-serif'
            },
            success: {
              iconTheme: { primary: 'var(--color-green)', secondary: 'white' }
            }
          }} 
        />
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
