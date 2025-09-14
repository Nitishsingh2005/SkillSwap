import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
  const { state, dispatch } = useApp();
  const location = useLocation();
  const isAuthenticated = state.isAuthenticated;
  
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
                <span className="font-bold text-xl text-gray-900">SkillSwap</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="flex items-center space-x-3">
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                  {state.currentUser?.avatar ? (
                    <img
                      src={state.currentUser.avatar}
                      alt={state.currentUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {state.currentUser?.name}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
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
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
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
