import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Star, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { UserCard } from '../components/ui/UserCard';
import { skillsAPI } from '../services/api';

const marqueeSkills = ['Python', 'UI/UX Design', 'Mandarin', 'Yoga', 'React', 'Cooking', 'Guitar', 'SEO', 'Data Science', 'Photography'];

const Landing = () => {
  const [swappers, setSwappers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSwappers = async () => {
      try {
        const response = await skillsAPI.getUsers();
        if (mounted) {
          // Take top 4 users for the landing page
          setSwappers(response.users?.slice(0, 4) || []);
        }
      } catch (error) {
        console.error("Failed to fetch swappers for landing page:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSwappers();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-surface font-sans text-ink selection:bg-accent-soft selection:text-accent">
      
      {/* Header */}
      <header className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg">S</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">SkillSwap</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/login" className="font-medium text-ink-muted hover:text-ink transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="bg-ink hover:bg-black text-white px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            Join Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[85vh]">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl relative z-10"
        >
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className="px-4 py-1.5 rounded-full bg-surface-2 border border-border text-sm font-semibold flex items-center gap-2 text-ink-muted">
              <CheckCircle2 className="w-4 h-4 text-green" /> 
              <span>Trust-based learning</span>
            </div>
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tight leading-[1.05] text-ink mb-8">
            Teach what you know.<br />
            <span className="italic text-accent">Learn what you don't.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-ink-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            The marketplace for human potential. Trade your expertise for the skills you've always wanted to learn—no money involved, just mutual growth.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-accent hover:bg-opacity-90 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-2 transition-transform hover:scale-105"
            >
              Start Swapping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Abstract Hero Visualization (Two skill bubbles trading) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div 
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }} 
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-[20%] left-[15%] w-64 h-64 bg-accent-soft rounded-full opacity-60 mix-blend-multiply blur-3xl"
          />
          <motion.div 
            animate={{ x: [0, -40, 0], y: [0, 50, 0] }} 
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[15%] w-80 h-80 bg-[#E8F0EA] rounded-full opacity-60 mix-blend-multiply blur-3xl"
          />
        </div>
      </section>

      {/* Social Proof Marquee */}
      <section className="py-10 border-y border-border bg-surface overflow-hidden flex items-center">
        <div className="flex gap-8 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
          {[...marqueeSkills, ...marqueeSkills, ...marqueeSkills].map((skill, i) => (
            <span key={i} className="text-xl md:text-2xl font-display text-ink-muted opacity-60 flex items-center gap-8">
              {skill}
              <span className="w-2 h-2 rounded-full bg-border inline-block" />
            </span>
          ))}
        </div>
      </section>


      {/* How it Works */}
      <section className="py-24 bg-surface-2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-display text-4xl md:text-5xl mb-6 tracking-tight">How it works</h2>
            <p className="text-lg text-ink-muted">A calm, asynchronous process designed to match you with exactly the right teacher and student.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-border z-0" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-sm">
                <Users className="w-10 h-10 text-ink" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Build your Profile</h3>
              <p className="text-ink-muted leading-relaxed">List what you can teach and what you want to learn. Our algorithm instantly finds overlapping needs in the community.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-sm">
                <ArrowLeftRight className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Request a Swap</h3>
              <p className="text-ink-muted leading-relaxed">When you find a match, send a swap request. You teach them for 30 minutes, they teach you for 30 minutes. Pure symmetry.</p>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-sm">
                <BookOpen className="w-10 h-10 text-green" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Meet & Grow</h3>
              <p className="text-ink-muted leading-relaxed">Jump into our purpose-built video rooms with integrated whiteboards and chat. Leave a review after to build trust.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Swappers */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl mb-4 tracking-tight">Active Swappers</h2>
            <p className="text-lg text-ink-muted">Real people sharing real knowledge right now.</p>
          </div>
          <Link to="/search" className="text-blue font-semibold hover:underline flex items-center gap-1">
            Browse all swappers <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
             <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {swappers.map((swapper, index) => (
               <motion.div 
                 key={swapper._id || swapper.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: index * 0.1 }}
               >
                 <UserCard 
                   user={{
                     name: swapper.name,
                     avatar: swapper.avatar,
                     skillsOffered: swapper.skillsOffered?.map(s => s.name || s) || [],
                     skillsWanted: swapper.skillsWanted?.map(s => s.name || s) || [],
                     rating: swapper.rating || 0,
                     reviewCount: swapper.reviewCount || 0
                   }}
                   className="h-full"
                   actionButton={
                     <Link to="/search" className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer">
                       <ArrowRight className="w-4 h-4" />
                     </Link>
                   }
                 />
               </motion.div>
            ))}
            
            {swappers.length === 0 && (
              <div className="col-span-full text-center py-12 text-ink-muted border border-dashed border-border rounded-xl">
                No active swappers visible at the moment.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <footer className="bg-ink text-surface py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-6xl mb-8 tracking-tight text-white">Stop paying for courses. Start connecting.</h2>
          <Link
            to="/register"
            className="inline-block bg-accent hover:bg-opacity-90 text-white px-10 py-5 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl"
          >
            Create Your Free Profile
          </Link>
          <div className="mt-20 pt-10 border-t border-slate-800 text-ink-muted flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-surface rounded flex items-center justify-center">
                <span className="text-ink font-display font-bold text-[10px]">S</span>
              </div>
              <span className="font-display font-bold">SkillSwap &copy; 2026</span>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="hover:text-surface cursor-pointer">Terms</span>
              <span className="hover:text-surface cursor-pointer">Privacy</span>
              <span className="hover:text-surface cursor-pointer">Guidelines</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Required for the marquee animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}} />
    </div>
  );
};

export default Landing;
