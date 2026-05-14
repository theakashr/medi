import React, { useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Pill, Mail, Lock, User, ArrowRight, Github, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const syncUserToFirestore = async (user: any, displayName?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || 'Staff Member',
        role: 'staff', // Default role
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
    } catch (err: any) {
      console.error(err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await syncUserToFirestore(result.user, name);
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || err.message;
      
      if (errorCode.includes('auth/user-not-found')) {
        setError('No account found with this email.');
      } else if (errorCode.includes('auth/wrong-password')) {
        setError('Incorrect password.');
      } else if (errorCode.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please log in instead.');
        // Optionally switch to login mode
        setTimeout(() => setMode('login'), 2000);
      } else if (errorCode.includes('auth/invalid-email')) {
        setError('Invalid email address format.');
      } else if (errorCode.includes('auth/weak-password')) {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (errorCode.includes('auth/too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-900/20"
            >
              <Pill size={40} />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              MediCart
            </h1>
            <p className="text-slate-400 font-medium tracking-wide">
              {mode === 'login' ? 'Welcome Back!' : mode === 'signup' ? 'Join the Team' : 'Reset Password'}
            </p>
          </div>

          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setMode('login')}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                mode === 'login' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all",
                mode === 'signup' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-bold uppercase tracking-wider flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {message}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      required
                      className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Secure Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-right">
              <button 
                onClick={() => setMode('forgot-password')}
                className="text-[10px] font-black text-slate-500 hover:text-emerald-500 uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === 'forgot-password' && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setMode('login')}
                className="text-[10px] font-black text-slate-500 hover:text-emerald-500 uppercase tracking-widest transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}

          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a0c10] px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Or Continue With</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 py-4 rounded-2xl text-[10px] font-black text-white hover:text-emerald-400 transition-all uppercase tracking-widest"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              disabled={loading}
              className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 py-4 rounded-2xl text-[10px] font-black text-white hover:text-emerald-400 transition-all uppercase tracking-widest"
            >
              <Github size={20} />
              GitHub
            </button>
          </div>

          <p className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            By continuing, you agree to our <br/> 
            <span className="text-emerald-600">Secure Protocol</span> & <span className="text-emerald-600">Privacy Policy</span>
          </p>
        </div>

        <div className="mt-8 flex justify-center items-center gap-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full" />
             System Online
           </div>
           <div className="flex items-center gap-2">
             <Lock size={12} />
             SSL 256-Bit
           </div>
           <div className="flex items-center gap-2">
             <Sparkles size={12} />
             v2.4.0
           </div>
        </div>
      </motion.div>
    </div>
  );
}

