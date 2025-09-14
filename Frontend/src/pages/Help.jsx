import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  MessageCircle,
  Mail,
  BookOpen,
  Shield,
  Video,
  Calendar
} from 'lucide-react';

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create my profile?',
          answer: 'After signing up, go to your Profile page and add your bio, skills, and availability. Make sure to specify which skills you can teach and which ones you want to learn.'
        },
        {
          question: 'What makes a good skill swap?',
          answer: 'The best skill swaps happen when both people have clear goals, similar time commitments, and complementary skill levels. Be specific about what you want to learn and what you can teach.'
        },
        {
          question: 'How do I find skill partners?',
          answer: 'Use our search function to find people by skills, location, or experience level. You can also check out our AI-powered match suggestions for personalized recommendations.'
        }
      ]
    },
    {
      category: 'Sessions & Booking',
      questions: [
        {
          question: 'How do I book a session?',
          answer: 'Go to the Booking page, select a partner, choose your preferred date and time, and specify what skills you\'ll exchange. The other person will need to confirm the session.'
        },
        {
          question: 'Can I cancel or reschedule a session?',
          answer: 'Yes, you can cancel or request to reschedule a session up to 24 hours before the scheduled time. Both parties will be notified of any changes.'
        },
        {
          question: 'What\'s the difference between video and chat sessions?',
          answer: 'Video sessions allow face-to-face interaction which is great for hands-on learning. Chat sessions are text-based and work well for code reviews, document sharing, and asynchronous learning.'
        }
      ]
    },
    {
      category: 'Safety & Guidelines',
      questions: [
        {
          question: 'How do I stay safe during sessions?',
          answer: 'Keep all communication on our platform initially. For video calls, we recommend starting with shorter sessions. Never share personal financial information, and report any inappropriate behavior.'
        },
        {
          question: 'What if someone doesn\'t show up to a session?',
          answer: 'If someone misses a confirmed session without notice, you can report this through our platform. Repeated no-shows may result in account restrictions.'
        },
        {
          question: 'How does the review system work?',
          answer: 'After each completed session, both participants can leave reviews rating communication, skill level, and punctuality. Reviews help maintain quality and trust in our community.'
        }
      ]
    },
    {
      category: 'Technical Support',
      questions: [
        {
          question: 'I\'m having trouble with video calls',
          answer: 'Make sure your browser allows camera and microphone access. We recommend using Chrome or Firefox for the best experience. Check your internet connection if you experience lag or disconnections.'
        },
        {
          question: 'How do I update my availability?',
          answer: 'Go to your Profile page and click on the availability section. You can set your preferred time slots for different days of the week.'
        },
        {
          question: 'Can I connect my external calendar?',
          answer: 'Calendar integration is coming soon! For now, we recommend manually checking your schedule before confirming sessions.'
        }
      ]
    }
  ];

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      qa => 
        qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qa.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const quickLinks = [
    {
      icon: BookOpen,
      title: 'Getting Started Guide',
      description: 'Learn the basics of skill swapping',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Video,
      title: 'Video Call Tips',
      description: 'Make the most of your video sessions',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Shield,
      title: 'Safety Guidelines',
      description: 'Stay safe while learning',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Calendar,
      title: 'Scheduling Best Practices',
      description: 'Tips for effective session planning',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How Can We Help You?</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions or get in touch with our support team.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {quickLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-12 h-12 ${link.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{link.title}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          
          {filteredFAQs.length > 0 ? (
            <div className="space-y-8">
              {filteredFAQs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h3>
                  <div className="space-y-4">
                    {category.questions.map((qa, qaIndex) => {
                      const uniqueIndex = categoryIndex * 100 + qaIndex;
                      const isExpanded = expandedFAQ === uniqueIndex;
                      
                      return (
                        <div key={qaIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                          <button
                            onClick={() => setExpandedFAQ(isExpanded ? null : uniqueIndex)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{qa.question}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </button>
                          
                          {isExpanded && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-700 leading-relaxed">{qa.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try different keywords or check out our quick links above.
              </p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-8 sticky top-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Still Need Help?</h3>
              <p className="text-gray-600">Get in touch with our support team</p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Describe your issue..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-4">Or reach us directly:</p>
              <a
                href="mailto:support@skillswap.com"
                className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@skillswap.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
