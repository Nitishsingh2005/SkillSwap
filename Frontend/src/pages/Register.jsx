import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import LegalModal from '../components/auth/LegalModal';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { api } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      // Store email for the verification waiting page
      sessionStorage.setItem('pendingVerificationEmail', formData.email);
      setRegisteredEmail(formData.email);
      setEmailSent(true);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show email-sent confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-surface">
        <div className="max-w-md w-full bg-surface-2 rounded-2xl border border-border shadow-lg p-10 text-center space-y-5">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-cyan-500" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Check your inbox!</h2>
          <p className="text-ink-muted text-sm leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-ink">{registeredEmail}</span>.<br />
            Click the link to activate your account.
          </p>
          <p className="text-ink-muted text-xs">Don't see it? Check your spam folder.</p>
          <Link
            to="/login"
            className="inline-block mt-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg tracking-tight">SS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-ink tracking-tight">Join SkillSwap</h2>
          <p className="mt-2 text-ink-muted font-medium">Create your account to start learning</p>
        </div>

        <div className="bg-surface-2 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg font-medium">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-ink mb-2 tracking-tight">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-ink-muted" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
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
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
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
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink mb-2 tracking-tight">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-ink-muted" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-surface border-border text-ink placeholder-slate-400 transition-all duration-300"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-ink-muted" /> : <Eye className="h-5 w-5 text-ink-muted" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-border rounded bg-surface border-border mt-1 cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-ink-muted font-medium">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors focus:outline-none"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors focus:outline-none"
                >
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-cyan-500/25 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-muted font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
        content={
          <>
            <h3 className="text-white font-semibold text-lg mb-2">1. Agreement to Terms</h3>
            <p>By accessing or using SkillSwap, you agree to be bound by these functional Terms of Service and all applicable laws and regulations. If you disagree with any part of the terms, you must not use our service to connect, learn, or teach.</p>
            
            <h3 className="text-white font-semibold text-lg mt-6 mb-2">2. User Conduct</h3>
            <p>As a community-driven skill-swapping platform, respect is paramount. You agree not to interact with other users in an abusive, discriminatory, or harassing manner. Engaging in such actions will result in immediate termination of your active account and potentially a permanent ban from SkillSwap.</p>

            <h3 className="text-white font-semibold text-lg mt-6 mb-2">3. Video Call Etiquette</h3>
            <p>During live sessions, users must maintain decorum. You are strictly forbidden from sharing explicit imagery via the screen share tool or using explicit language in video chats or on the collaborative whiteboard. Recordings of videos without explicit mutual consent are prohibited.</p>

            <h3 className="text-white font-semibold text-lg mt-6 mb-2">4. Profile Accuracy</h3>
            <p>You agree that the skills you list, your availability, and portfolio links accurately represent your current abilities. Deliberately misrepresenting skills harms the learning ecosystem and qualifies for suspension.</p>
          </>
        }
      />

      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        content={
          <>
            <h3 className="text-white font-semibold text-lg mb-2">1. Information Collection</h3>
            <p>When you register for SkillSwap, we collect personal information such as your name, email, profile picture, the specific skills you want to learn, and the specific skills you wish to teach. This data forms the backbone of our matchmaking algorithm.</p>
            
            <h3 className="text-white font-semibold text-lg mt-6 mb-2">2. Location & Media</h3>
            <p>If you upload pictures or establish video meetings, we may process visual media data. Real-time media (cameras and microphones) is transmitted using WebRTC protocols. Whiteboard and chat sessions during calls are encrypted in transit via Socket.io.</p>

            <h3 className="text-white font-semibold text-lg mt-6 mb-2">3. Data Sharing</h3>
            <p>Your profile data (name, avatar, and core skills) is visible to other SkillSwap members to facilitate friend requests and matchmaking. We do not sell your personal data to extensive third-party marketing services.</p>

            <h3 className="text-white font-semibold text-lg mt-6 mb-2">4. Your Rights</h3>
            <p>You may request deletion of all your stored data (including past messages, review records, and session logs) by contacting the administration directly. Alternatively, you can modify your portfolio, links, and avatar from your primary profile settings page at any time.</p>
          </>
        }
      />
    </div>
  );
};

export default Register;
