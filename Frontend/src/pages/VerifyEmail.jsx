import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { CheckCircle, XCircle, Mail, RefreshCw, Loader } from 'lucide-react';

/**
 * VerifyEmail page — handles two states:
 * 1. /verify-email/:token  — auto-verifies the user, logs them in
 * 2. /verify-email         — "check your inbox" holding page with resend option
 */
const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const hasVerified = useRef(false); // guard against React StrictMode double-invoke

  const [status, setStatus] = useState('loading'); // loading | success | error | waiting
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(
    () => sessionStorage.getItem('pendingVerificationEmail') || ''
  );
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    if (!token) {
      // No token → show waiting/instructions page
      setStatus('waiting');
      return;
    }

    // Token present → call verify API
    const verify = async () => {
      // Prevent double-call (React StrictMode runs effects twice in dev)
      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const data = await authAPI.verifyEmail(token);
        // Log the user in using the tokens returned by the verify endpoint
        localStorage.setItem('token', data.accessToken || data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        dispatch({ type: 'LOGIN', payload: data.user });
        sessionStorage.removeItem('pendingVerificationEmail');
        setStatus('success');
        // Redirect to dashboard after 2.5s
        setTimeout(() => navigate('/dashboard'), 2500);
      } catch (err) {
        // If token was already used (e.g. double-click), treat as success and go to login
        if (err.message?.includes('already been used')) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      }

    };

    verify();
  }, [token, dispatch, navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResendStatus('sending');
    try {
      await authAPI.resendVerification(email);
      setResendStatus('sent');
    } catch (err) {
      setResendStatus('error');
    }
  };

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center space-y-4">
          <Loader className="w-10 h-10 text-cyan-500 animate-spin mx-auto" />
          <p className="text-ink-muted font-medium">Verifying your email…</p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full bg-surface-2 rounded-2xl border border-border shadow-lg p-10 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Email Verified!</h2>
          <p className="text-ink-muted">Your account is now active. Redirecting to your dashboard…</p>
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-md w-full bg-surface-2 rounded-2xl border border-border shadow-lg p-10 text-center space-y-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-ink">Link Expired</h2>
          <p className="text-ink-muted text-sm">{message}</p>
          <p className="text-ink-muted text-sm">Enter your email to get a new verification link.</p>
          <div className="space-y-3 mt-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
            />
            <button
              onClick={handleResend}
              disabled={!email || resendStatus === 'sending' || resendStatus === 'sent'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-50 transition-all"
            >
              {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? '✓ Email Sent!' : 'Resend Verification Email'}
            </button>
          </div>
          <Link to="/login" className="text-sm text-cyan-400 hover:text-cyan-300 block mt-2">Back to Login</Link>
        </div>
      </div>
    );
  }

  // ── Waiting (no token — post-register holding page) ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-surface-2 rounded-2xl border border-border shadow-lg p-10 text-center space-y-5">
        <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-cyan-500" />
        </div>
        <h2 className="text-2xl font-bold text-ink">Check your inbox</h2>
        <p className="text-ink-muted text-sm leading-relaxed">
          We sent a verification link to{' '}
          <span className="font-semibold text-ink">{email || 'your email'}</span>.
          Click the link in the email to activate your account.
        </p>
        <p className="text-ink-muted text-xs">Didn't receive it? Check your spam folder.</p>

        {resendStatus === 'sent' ? (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Email resent successfully!
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={!email || resendStatus === 'sending'}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${resendStatus === 'sending' ? 'animate-spin' : ''}`} />
            {resendStatus === 'sending' ? 'Resending…' : 'Resend email'}
          </button>
        )}

        <Link to="/login" className="text-sm text-ink-muted hover:text-ink block transition-colors">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
