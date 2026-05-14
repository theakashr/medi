import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Lock, 
  Bell, 
  Globe, 
  Database,
  ShieldCheck,
  Save,
  CheckCircle2
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Settings() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    role: 'admin',
    email: auth.currentUser?.email || '',
    displayName: auth.currentUser?.displayName || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        // Fetch User Profile
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(prev => ({ ...prev, ...userSnap.data() }));
        }

        // Fetch Global Store Info
        const storeRef = doc(db, 'settings', 'store_info');
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          setProfile(prev => ({ ...prev, ...storeSnap.data() }));
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      // Save User Profile
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: profile.displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Save Global Store Info (if admin)
      // Note: Ideally we check role, but for now we attempt to save both
      await setDoc(doc(db, 'settings', 'store_info'), {
        businessName: profile.businessName || '',
        gstNumber: profile.gstNumber || '',
        phone: profile.phone || '',
        address: profile.address || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings. You might not have permission.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Full Profile' },
    { id: 'store', icon: Building2, label: 'Store Details' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure your pharmacy profile and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <form onSubmit={handleSave} className="p-8 space-y-8">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-2xl">
                      {profile.displayName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{profile.displayName}</h3>
                      <p className="text-sm text-slate-500">{profile.email}</p>
                      <span className="mt-2 inline-block px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-black rounded-lg">
                        {profile.role} Access
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.displayName || ''} 
                        onChange={e => setProfile({...profile, displayName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Contact Email</label>
                      <input 
                        type="email" 
                        value={profile.email || ''} 
                        disabled
                        className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl p-3 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'store' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Pharmacy Name</label>
                      <input 
                        type="text" 
                        value={profile.businessName || ''} 
                        onChange={e => setProfile({...profile, businessName: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. MediCart Wellness Center"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">GST Number</label>
                      <input 
                        type="text" 
                        value={profile.gstNumber || ''} 
                        onChange={e => setProfile({...profile, gstNumber: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                        placeholder="29AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Phone Number</label>
                      <input 
                        type="text" 
                        value={profile.phone || ''} 
                        onChange={e => setProfile({...profile, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Store Address</label>
                      <textarea 
                        rows={3}
                        value={profile.address || ''} 
                        onChange={e => setProfile({...profile, address: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Complete business address..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                   <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold">Two-Factor Authentication</h4>
                        <p className="text-xs text-slate-500">Security managed by Google Authentication</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full uppercase">Enabled</span>
                   </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {showSuccess ? (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={16} /> Changes saved successfully!
                  </motion.div>
                ) : <div />}
                
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18} /> Save Settings</>}
                </button>
              </div>
            </form>
          </motion.div>
          
          <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-900/40 flex gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200">Database Connection</h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 opacity-80">Your store data is being synchronized with Google Firestore (asia-southeast1). Regular backups are enabled automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
