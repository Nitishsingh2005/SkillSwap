import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
//import { sampleUsers } from '../utils/sampleData';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendStatus, setResendStatus] = useState('idle'); // idle | sending | sent
  
  const { api } = useApp();
  const navigate = useNavigate();
  // Import authAPI for resend (doesn't need context)
  const { authAPI: rawAuthAPI } = { authAPI: null };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverifiedEmail(null);
    setResendStatus('idle');

    try {
      await api.login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      // 403 with requiresVerification means email not verified yet
      if (error.message?.includes('verify your email')) {
        setUnverifiedEmail(email);
      } else {
        setError(error.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendStatus('sending');
    try {
      const { authAPI: aAPI } = await import('../services/api');
      await aAPI.resendVerification(unverifiedEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg tracking-tight">SS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-ink tracking-tight">Welcome back</h2>
          <p className="mt-2 text-ink-muted font-medium">Sign in to your SkillSwap account</p>
        </div>

        <div className="bg-surface-2 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            {unverifiedEmail && (
              <div className="rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-400/10 to-orange-400/5 p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">Email not verified</p>
                    <p className="text-xs text-gray-600 font-medium truncate">{unverifiedEmail}</p>
                  </div>
                </div>

                {/* Body */}
                <p className="text-xs text-gray-700 leading-relaxed pl-0.5">
                  Check your inbox and click the verification link to activate your account.
                </p>

                {/* Resend button */}
                {resendStatus === 'sent' ? (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-semibold pl-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Verification email sent!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === 'sending'}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 hover:text-black disabled:opacity-50 transition-colors pl-0.5 group"
                  >
                    {resendStatus === 'sending' ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 group-hover:-rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 8-16 8V4zm0 8h16"/>
                        </svg>
                        Resend verification email
                      </>
                    )}
                  </button>
                )}
              </div>
            )}


            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink mb-2 tracking-tight">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-ink-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink mb-2 tracking-tight">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-ink-muted" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-ink-muted" /> : <Eye className="h-5 w-5 text-ink-muted" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-border rounded bg-surface border-border"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-ink-muted font-medium">
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-cyan-500/25"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>


          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-2 text-ink-muted font-medium">Or continue with</span>
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
