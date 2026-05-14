import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  History, 
  Star,
  ChevronRight,
  UserCircle,
  UserPlus
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer, Bill } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerHistory, setCustomerHistory] = useState<Bill[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
      setCustomers(docs);
    });
    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const viewHistory = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const q = query(
      collection(db, 'bills'), 
      where('customerId', '==', customer.id),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
    setCustomerHistory(history);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Customer List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Users size={120} />
          </div>
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Customer Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Track loyalty points and purchase behavior.</p>
          </div>
          <button className="relative flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
            <Plus size={20} /> Add New
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Search className="text-slate-400 ml-4" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or phone number..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCustomers.map((customer) => (
            <motion.div
              layout
              key={customer.id}
              onClick={() => viewHistory(customer)}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden",
                selectedCustomer?.id === customer.id 
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200 dark:hover:border-emerald-900"
              )}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <UserCircle size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg leading-tight truncate">{customer.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                    <Phone size={12} /> {customer.phone}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    <Star size={14} fill="currentColor" /> {customer.loyaltyPoints}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Points</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
                  <p className="font-bold">₹{customer.totalSpent.toLocaleString()}</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </motion.div>
          ))}
          
          {/* Mock Customers for design */}
          {filteredCustomers.length === 0 && !searchTerm && (
            [1, 2, 3, 4].map(id => (
              <div key={id} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60 flex flex-col items-center justify-center gap-4 border-dashed py-10">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                  <UserPlus size={24}/>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No customer found</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* History Detail Panel */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden sticky top-24 min-h-[500px] flex flex-col">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500 mb-6 flex items-center gap-2">
              <History size={14} /> Selection Details
            </h3>
            
            {selectedCustomer ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-black mb-1">{selectedCustomer.name}</h2>
                <p className="text-slate-500 font-medium mb-6">{selectedCustomer.phone}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Points</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedCustomer.loyaltyPoints}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Visits</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{customerHistory.length}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 text-center opacity-30">
                <UserCircle size={64} className="mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Select a customer to view profile</p>
              </div>
            )}
          </div>

          <div className="flex-1 p-6">
            <h4 className="font-bold text-sm mb-4">Recent Purchase History</h4>
            <div className="space-y-3">
              {selectedCustomer ? (
                customerHistory.length > 0 ? customerHistory.map((bill) => (
                  <div key={bill.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-emerald-200 transition-all">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{bill.billNumber}</p>
                      <p className="text-xs text-slate-500 font-medium">{bill.createdAt.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{bill.finalAmount.toLocaleString()}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400">{bill.paymentMethod}</p>
                    </div>
                  </div>
                )) : <p className="text-center text-sm text-slate-400 py-10">No history available</p>
              ) : (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-pulse opacity-20"></div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
