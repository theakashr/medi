import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Sun,
  Moon,
  Search
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Pill, label: 'Inventory', path: '/inventory' },
  { icon: ShoppingCart, label: 'Billing', path: '/billing' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#020617]/80 backdrop-blur-3xl border-r border-white/5 transition-all duration-500 ease-in-out md:static md:translate-x-0 overflow-hidden",
          !isSidebarOpen && "-translate-x-full md:w-24"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-8 flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-900/20"
            >
              <Pill size={28} />
            </motion.div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    MediCart
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">v2.4 Pro</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            <div className="px-4 mb-4">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 transition-opacity",
                !isSidebarOpen && "opacity-0"
              )}>Main Menu</span>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                  location.pathname === item.path 
                    ? "bg-emerald-600/10 text-white shadow-[0_0_20px_rgba(5,150,105,0.1)]" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  location.pathname === item.path ? "bg-emerald-600 text-white" : "bg-slate-800/50 group-hover:bg-slate-800"
                )}>
                  <item.icon size={20} />
                </div>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-bold tracking-wide text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
                {location.pathname === item.path && (
                  <motion.div 
                    layoutId="active-nav-bg"
                    className="absolute inset-0 border border-emerald-500/20 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 space-y-3">
             <div className={cn(
                "bg-slate-900/50 border border-white/5 rounded-2xl p-4 transition-all",
                !isSidebarOpen && "opacity-0 invisible"
             )}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Health</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-xs font-bold text-white">All Systems Operational</span>
                </div>
             </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">Theme</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm tracking-wide"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mesh Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#020617]/40 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 w-96 group focus-within:border-emerald-500/50 transition-all">
              <Search size={18} className="text-slate-500 group-focus-within:text-emerald-500" />
              <input 
                type="text" 
                placeholder="Lookup patient identity or medication..." 
                className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full outline-none text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all relative">
                 <Bell size={20} />
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-4 ring-emerald-500/20"></span>
               </button>
            </div>
            
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-white uppercase tracking-wider">{auth.currentUser?.displayName || 'Staff'}</p>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md mt-0.5 inline-block">Medical Officer</p>
              </div>
              {auth.currentUser?.photoURL ? (
                <div className="relative group cursor-pointer">
                   <img 
                    src={auth.currentUser.photoURL} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all"
                  />
                  <div className="absolute inset-0 bg-emerald-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-emerald-900/40 relative group cursor-pointer">
                  {(auth.currentUser?.displayName || auth.currentUser?.email || 'U').charAt(0).toUpperCase()}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
