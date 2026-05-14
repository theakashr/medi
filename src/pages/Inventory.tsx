import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Pill,
  AlertCircle,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Medicine } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { getMedicineSuggestions } from '../lib/gemini';

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Partial<Medicine> | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'medicines'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medicine[];
        setMedicines(docs);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'medicines');
      }
    });
    return () => unsubscribe();
  }, []);

  const categories = Array.from(new Set(medicines.map(m => m.category))).filter(Boolean) as string[];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? m.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: (formData.get('name') as string) || '',
      category: (formData.get('category') as string) || '',
      price: parseFloat(formData.get('price') as string) || 0,
      stock: parseInt(formData.get('stock') as string) || 0,
      lowStockThreshold: parseInt(formData.get('lowStockThreshold') as string) || 5,
      expiryDate: (formData.get('expiryDate') as string) || '',
      supplier: (formData.get('supplier') as string) || '',
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedMedicine?.id) {
        await updateDoc(doc(db, 'medicines', selectedMedicine.id), data);
      } else {
        await addDoc(collection(db, 'medicines'), data);
      }
      setIsModalOpen(false);
      setSelectedMedicine(null);
    } catch (err) {
      handleFirestoreError(err, selectedMedicine?.id ? OperationType.UPDATE : OperationType.CREATE, 'medicines');
    }
  };

  const handleAiAsk = async (name: string) => {
    if (!name) return;
    setIsAiLoading(true);
    const suggestion = await getMedicineSuggestions(name);
    setAiSuggestion(suggestion);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-10 pb-12 relative overflow-visible">
      {/* Background Decorative Bubble */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
        <div>
           <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-900/10">
              <Pill className="text-emerald-500" size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500/80">Inventory Protocol</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black text-white tracking-tighter"
          >
            Medicine <span className="text-emerald-500">Repository</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 font-medium tracking-wide mt-3 text-lg"
          >
            Manage and monitor pharmaceutical stock levels in <span className="text-white font-black underline decoration-emerald-500/30 decoration-4 underline-offset-4">Real-time Persistence</span>
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-white/5 backdrop-blur-md"
        >
          <button 
            onClick={() => { setSelectedMedicine(null); setIsModalOpen(true); }}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-3"
          >
            <Plus size={18} strokeWidth={3} /> Register Item
          </button>
          <button className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all shadow-xl active:scale-95">
            <Download size={20} />
          </button>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
      </div>

      {/* Filters & Search - Glass Enhanced */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4 rounded-[2rem] border-white/5 flex flex-col md:flex-row gap-4 items-center"
      >
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by pharmaceutical name, molecular formula or category..." 
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto shrink-0">
          <div className="relative group flex-1 md:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-emerald-500 transition-colors pointer-events-none" size={18} />
            <select 
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full md:w-56 bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white font-bold text-xs uppercase tracking-widest outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#020617]">All Classes</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat} className="bg-[#020617]">{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory(null); }}
            className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all"
          >
            RESET_FILTERS
          </button>
        </div>
      </motion.div>

      {/* Inventory Grid/Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredMedicines.map((medicine, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: index * 0.05 }}
              key={medicine.id}
              className="glass-card group relative p-0 overflow-hidden hover:border-emerald-500/30"
            >
              {/* Card Header Section */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-white/5 text-emerald-500 rounded-3xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                    <Pill size={32} strokeWidth={1.5} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => handleAiAsk(medicine.name)}
                      className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                    >
                      <Sparkles size={18} />
                    </button>
                    <button 
                      onClick={() => { setSelectedMedicine(medicine); setIsModalOpen(true); }}
                      className="p-3 bg-white/5 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-xl text-white tracking-tight leading-tight group-hover:text-emerald-400 transition-colors uppercase">{medicine.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Class:</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{medicine.category}</span>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-8 grid grid-cols-2 gap-4 bg-white/[0.02]">
                <div className="space-y-2">
                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em]">Available Units</p>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-3xl font-black tracking-tighter",
                      medicine.stock <= medicine.lowStockThreshold ? "text-amber-500" : "text-white"
                    )}>
                      {medicine.stock}
                    </span>
                    {medicine.stock <= medicine.lowStockThreshold && (
                      <div className="flex items-center justify-center w-6 h-6 bg-amber-500/10 rounded-full animate-pulse">
                        <AlertCircle size={14} className="text-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.2em]">Unit Value</p>
                  <span className="text-3xl font-black text-white tracking-tighter group-hover:text-emerald-500 transition-colors">₹{medicine.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Progress/Footer */}
              <div className="p-8 pt-6">
                <div className="flex justify-between items-center mb-3">
                   <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Stock Integrity</span>
                    <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((medicine.stock / (medicine.lowStockThreshold * 3)) * 100, 100)}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          medicine.stock <= medicine.lowStockThreshold ? "bg-amber-500" : "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Expiration</span>
                    <p className={cn(
                       "text-[11px] font-black uppercase tracking-wider",
                       new Date(medicine.expiryDate) < new Date() ? "text-red-500" : "text-white"
                    )}>{medicine.expiryDate}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {aiSuggestion && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 border border-slate-200 dark:border-slate-800 relative shadow-2xl"
            >
              <button 
                onClick={() => setAiSuggestion(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold">AI Medicine Insight</h3>
              </div>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                {aiSuggestion}
              </div>
              <button 
                onClick={() => setAiSuggestion(null)}
                className="w-full mt-8 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-8 border border-slate-200 dark:border-slate-800 relative my-8"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Plus className="rotate-45" size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-8">{selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Medicine Name</label>
                  <input name="name" defaultValue={selectedMedicine?.name} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Paracetamol 500mg" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Category</label>
                  <input name="category" defaultValue={selectedMedicine?.category} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Tablets" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Price (₹)</label>
                  <input name="price" type="number" step="0.01" defaultValue={selectedMedicine?.price} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Stock Quantity</label>
                  <input name="stock" type="number" defaultValue={selectedMedicine?.stock} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 100" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Low Stock Threshold</label>
                  <input name="lowStockThreshold" type="number" defaultValue={selectedMedicine?.lowStockThreshold} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Expiry Date</label>
                  <input name="expiryDate" type="date" defaultValue={selectedMedicine?.expiryDate} required className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Supplier</label>
                  <input name="supplier" defaultValue={selectedMedicine?.supplier} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Acme Pharma" />
                </div>
                <div className="sm:col-span-2 pt-4">
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
                    {selectedMedicine ? 'Update Medicine' : 'Add to Inventory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Loading State */}
      <AnimatePresence>
        {isAiLoading && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-950 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Consulting Medi-AI...</h3>
                <p className="text-slate-500">Retrieving specialized medical insights for you.</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
