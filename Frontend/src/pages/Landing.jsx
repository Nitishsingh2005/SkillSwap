import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Calendar, Star, MessageCircle, Video, Search } from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: Search,
      title: 'Find Your Perfect Match',
      description: 'Search for skill partners based on expertise, location, and availability.',
    },
    {
      icon: MessageCircle,
      title: 'Connect & Chat',
      description: 'Real-time messaging to coordinate and plan your skill exchange sessions.',
    },
    {
      icon: Video,
      title: 'Video Learning',
      description: 'Face-to-face sessions for more effective learning and teaching.',
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Book sessions that fit your schedule with integrated calendar management.',
    },
    {
      icon: Star,
      title: 'Quality Assured',
      description: 'Review and rating system ensures high-quality learning experiences.',
    },
    {
      icon: Users,
      title: 'Growing Community',
      description: 'Join thousands of learners and teachers in our vibrant community.',
    },
  ];

  const testimonials = [
    {
      name: 'Nitish Singh',
      role: 'Full-stack Developer',
      content: 'SkillSwap helped me learn Python from a data scientist while teaching React. Amazing platform!',
      avatar: '#',
      rating: 5,
    },
    {
      name: 'Govind',
      role: 'UX Designer',
      content: 'I love how easy it is to find people who want to learn design in exchange for coding skills.',
      avatar: '#',
      rating: 5,
    },
    {
      name: 'Harry',
      role: 'Data Scientist',
      content: 'The video call feature makes learning so much more effective. Highly recommend!',
      avatar: '#',
      rating: 5,
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Your Profile',
      description: 'Tell us about your skills and what you want to learn.',
    },
    {
      number: '2',
      title: 'Find Partners',
      description: 'Browse or get matched with compatible skill partners.',
    },
    {
      number: '3',
      title: 'Start Learning',
      description: 'Schedule sessions and start exchanging knowledge.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm tracking-tight">SS</span>
              </div>
              <span className="font-bold text-xl text-slate-100 tracking-tight">SkillSwap</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
        {/* Complex Background Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(20,184,166,0.12),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_60%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-slate-100 via-cyan-200 to-teal-200 bg-clip-text text-transparent tracking-tight leading-tight">
            Learn by Teaching,
            <br />
            <span className="text-cyan-300 font-black">Teach by Learning</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium tracking-wide">
            Connect with like-minded individuals to exchange skills and knowledge. Turn your expertise into learning opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 hover:scale-105"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/help"
              className="border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-800/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4 tracking-tight">How SkillSwap Works</h2>
          <p className="text-xl text-slate-300 mb-16 font-medium tracking-wide">Get started in three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="group">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-110">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-slate-100 mb-4 tracking-tight">{step.title}</h3>
                <p className="text-slate-300 text-lg leading-relaxed font-normal">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4 tracking-tight">Why Choose SkillSwap?</h2>
          <p className="text-xl text-slate-300 mb-16 font-medium tracking-wide">Everything you need for effective skill exchange</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colors = [
                'from-cyan-500 to-teal-500',
                'from-blue-500 to-indigo-500', 
                'from-purple-500 to-violet-500',
                'from-emerald-500 to-teal-500',
                'from-orange-500 to-amber-500',
                'from-rose-500 to-pink-500'
              ];
              const bgColors = [
                'bg-cyan-500/10',
                'bg-blue-500/10',
                'bg-purple-500/10', 
                'bg-emerald-500/10',
                'bg-orange-500/10',
                'bg-rose-500/10'
              ];
              return (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 text-left group">
                  <div className={`w-12 h-12 bg-gradient-to-r ${colors[index % colors.length]} text-white rounded-lg flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-100 mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed font-normal">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-800/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4 tracking-tight">What Our Users Say</h2>
          <p className="text-xl text-slate-300 mb-16 font-medium tracking-wide">Join thousands of successful skill swappers</p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="flex items-center mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />)}
                </div>
                <p className="text-slate-300 mb-6 italic leading-relaxed font-normal">"{t.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full mr-4 flex items-center justify-center text-white font-bold tracking-tight">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 tracking-tight">{t.name}</h4>
                    <p className="text-slate-400 text-sm font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white text-center overflow-hidden">
        {/* Complex Background Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(6,182,212,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(20,184,166,0.12),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_60%)]"></div>
        
        <div className="relative">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-100 via-cyan-200 to-teal-200 bg-clip-text text-transparent tracking-tight">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 text-slate-300 font-medium tracking-wide">Join our community of learners and teachers today</p>
          <Link
            to="/register"
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 hover:scale-105"
          >
            <span>Sign Up Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700/50 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="font-bold text-xl text-slate-100 tracking-tight">SkillSwap</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-normal">Connecting learners and teachers worldwide for meaningful skill exchange.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-100 tracking-tight">Platform</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">How it Works</Link></li>
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">Safety</Link></li>
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-100 tracking-tight">Support</h3>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">Help Center</Link></li>
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-cyan-400 transition-colors font-medium">Community</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-slate-100 tracking-tight">Company</h3>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">About</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Privacy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors font-medium">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400">
          <p className="font-medium">&copy; 2025 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
