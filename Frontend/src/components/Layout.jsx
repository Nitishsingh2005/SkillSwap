import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Calendar, 
  User, 
  Star,
  Bell,
  HelpCircle,
  LogOut,
  Users
} from 'lucide-react';

const Layout = () => {
  const { state, api } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = state.isAuthenticated;
  
  // Debug logging for avatar updates
  console.log("Layout render - currentUser:", state.currentUser);
  console.log("Layout render - avatar:", state.currentUser?.avatar);
  
  const handleLogout = async () => {
    try {
      await api.logout();
      // Redirect to landing page after successful logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      // Redirect to landing page even if API call fails
      navigate('/');
    }
  };

  const unreadNotifications = state.notifications.filter(n => !n.read).length;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Messages', href: '/chat', icon: MessageCircle },
    { name: 'Schedule', href: '/booking', icon: Calendar },
    { name: 'Matches', href: '/matches', icon: Users },
    { name: 'Reviews', href: '/reviews', icon: Star },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Navigation */}
      <nav className="bg-slate-800/80 backdrop-blur-md shadow-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm tracking-tight">SS</span>
                </div>
                <span className="font-bold text-xl text-slate-100 tracking-tight">SkillSwap</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-slate-300 hover:text-cyan-400 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-slate-700/50 px-3 py-2 rounded-lg transition-all duration-300 border border-transparent hover:border-cyan-500/30">
                  {state.currentUser?.avatar ? (
                    <img
                      src={
                        state.currentUser.avatar.startsWith("http")
                          ? state.currentUser.avatar
                          : `http://localhost:5000${state.currentUser.avatar}`
                      }
                      alt={state.currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-600"
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  {!state.currentUser?.avatar && (
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-200">
                    {state.currentUser?.name}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-slate-800/50 backdrop-blur-sm shadow-lg min-h-screen border-r border-slate-700/50">
          <div className="p-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/20'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold tracking-tight">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
