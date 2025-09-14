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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="font-bold text-xl text-gray-900">SkillSwap</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Learn by Teaching,
            <br />
            <span className="text-blue-200">Teach by Learning</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Connect with like-minded individuals to exchange skills and knowledge. Turn your expertise into learning opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/help"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How SkillSwap Works</h2>
          <p className="text-xl text-gray-600 mb-16">Get started in three simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index}>
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose SkillSwap?</h2>
          <p className="text-xl text-gray-600 mb-16">Everything you need for effective skill exchange</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 mb-16">Join thousands of successful skill swappers</p>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex items-center mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-gray-700 mb-6 italic">"{t.content}"</p>
                <div className="flex items-center">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{t.name}</h4>
                    <p className="text-gray-600 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
        <p className="text-xl mb-8 text-blue-100">Join our community of learners and teachers today</p>
        <Link
          to="/register"
          className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center space-x-2 transition-colors"
        >
          <span>Sign Up Now</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="font-bold text-xl">SkillSwap</span>
            </div>
            <p className="text-gray-400">Connecting learners and teachers worldwide for meaningful skill exchange.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/help" className="hover:text-white">How it Works</Link></li>
              <li><Link to="/help" className="hover:text-white">Safety</Link></li>
              <li><Link to="/help" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link to="/help" className="hover:text-white">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-white">Community</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
