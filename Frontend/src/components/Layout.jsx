import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  Users,
  Menu,
  X,
  Shield
} from 'lucide-react';

const Layout = () => {
  const { state, api } = useApp();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = state.isAuthenticated;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we are in an active chat conversation
  const isChatOpen = location.pathname === '/chat' && !!searchParams.get('user');
  
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
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Reviews', href: '/reviews', icon: Star },
    { name: 'Help', href: '/help', icon: HelpCircle },
  ];

  if (state.currentUser?.isAdmin) {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface font-sans text-ink">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-surface font-sans text-ink flex flex-col overflow-hidden">
      {/* Top Navigation - hide when chat is open */}
      {!isChatOpen && (
      <nav className="bg-surface/90 backdrop-blur-md shadow-sm border-b border-border z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 -ml-2 mr-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-surface-2"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm tracking-tight">S</span>
                </div>
                <span className="font-display font-bold text-xl text-ink tracking-tight hidden sm:block">SkillSwap</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-ink-muted hover:text-ink transition-colors rounded-lg hover:bg-surface-2">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold border-2 border-surface">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-surface-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-300 border border-transparent hover:border-border">
                  {state.currentUser?.avatar ? (
                    <img
                      src={
                        state.currentUser.avatar.startsWith("http")
                          ? state.currentUser.avatar
                          : `${import.meta.env.VITE_API_URL}${state.currentUser.avatar}`
                      }
                      alt={state.currentUser.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  {!state.currentUser?.avatar && (
                    <div className="w-8 h-8 bg-surface-2 rounded-full flex items-center justify-center border border-border">
                      <User className="w-5 h-5 text-ink-muted" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-ink hidden sm:block">
                    {state.currentUser?.name}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-ink-muted hover:text-red-500 transition-colors rounded-lg hover:bg-surface-2"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Mobile Sidebar Overlay - hide when chat is open */}
        {isSidebarOpen && !isChatOpen && (
          <div 
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation - hide when chat is open */}
        {!isChatOpen && (
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-surface lg:bg-transparent shadow-xl lg:shadow-none border-r border-border transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            h-full overflow-y-auto
          `}
        >
          {state.currentUser && (
            <div className="lg:hidden p-6 border-b border-border flex flex-col items-center">
                   {state.currentUser?.avatar ? (
                    <img
                      src={
                        state.currentUser.avatar.startsWith("http")
                          ? state.currentUser.avatar
                          : `${import.meta.env.VITE_API_URL}${state.currentUser.avatar}`
                      }
                      alt={state.currentUser.name}
                      className="w-16 h-16 rounded-full object-cover shadow-sm mb-3"
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  {!state.currentUser?.avatar && (
                    <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center shadow-sm mb-3 border border-border">
                      <span className="text-2xl font-display font-bold text-ink">{state.currentUser.name.charAt(0)}</span>
                    </div>
                  )}
              <h3 className="font-display font-bold text-ink">{state.currentUser.name}</h3>
              <p className="text-sm text-ink-muted">{state.currentUser.email}</p>
            </div>
          )}

          <div className="p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-accent-soft text-accent font-semibold'
                          : 'text-ink-muted hover:bg-surface-2 hover:text-ink font-medium'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-ink-muted'}`} />
                      <span className="tracking-tight">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="p-4 mt-auto lg:hidden">
             <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-ink-muted hover:bg-red-50 hover:text-red-500 transition-all duration-300 w-full font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span className="tracking-tight">Sign Out</span>
              </button>
          </div>
        </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
