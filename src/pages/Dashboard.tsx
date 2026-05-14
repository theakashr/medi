import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Medicine, Bill } from '../types';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const categoryData = [
  { name: 'Tablets', value: 400, color: '#059669' },
  { name: 'Syrups', value: 300, color: '#10b981' },
  { name: 'Injectables', value: 200, color: '#34d399' },
  { name: 'Others', value: 100, color: '#6ee7b7' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMedicines: 0,
    totalCustomers: 0,
    dailySales: 0,
    monthlyRevenue: 0,
    lowStock: 0
  });

  const [recentBills, setRecentBills] = useState<Bill[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real counts from collections
        const [medicinesSnap, customersSnap, billsSnap] = await Promise.all([
          getDocs(collection(db, 'medicines')),
          getDocs(collection(db, 'customers')),
          getDocs(collection(db, 'bills'))
        ]);

        const medicines = medicinesSnap.docs.map(doc => doc.data() as Medicine);
        const bills = billsSnap.docs.map(doc => doc.data() as Bill);
        
        // Calculate daily sales and monthly revenue
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayBills = bills.filter(b => b.createdAt?.toDate() >= startOfDay);
        const monthlyBills = bills.filter(b => b.createdAt?.toDate() >= startOfMonth);

        const totalRevenue = monthlyBills.reduce((acc, b) => acc + b.finalAmount, 0);
        const lowStockCount = medicines.filter(m => m.stock <= m.lowStockThreshold).length;

        setStats({
          totalMedicines: medicinesSnap.size,
          totalCustomers: customersSnap.size,
          dailySales: todayBills.length,
          monthlyRevenue: totalRevenue,
          lowStock: lowStockCount
        });

        // Set recent bills for table
        const qRecent = query(collection(db, 'bills'), orderBy('createdAt', 'desc'), limit(5));
        const recentSnapshot = await getDocs(qRecent);
        const fetchedRecentBills = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
        setRecentBills(fetchedRecentBills);

      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-12 pb-12 relative overflow-visible">
      {/* Background Decorative Bubble */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -left-48 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black text-white tracking-tighter mb-4"
          >
            System <span className="text-emerald-500">Overview</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 font-medium tracking-wide text-lg"
          >
            Real-time analytics and store status for <span className="text-white font-bold underline decoration-emerald-500/30 decoration-4 underline-offset-4">MediCart Pro</span>
          </motion.p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-white/5 backdrop-blur-md"
        >
          <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
            Download Report
          </button>
          <button className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95">
            Manage Data
          </button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {[
          { label: 'Inventory Assets', value: stats.totalMedicines, icon: Pill, color: 'emerald', trend: '+12.4%', trendUp: true },
          { label: 'Patient Database', value: stats.totalCustomers, icon: Users, color: 'blue', trend: '+5.2%', trendUp: true },
          { label: "Daily Throughput", value: stats.dailySales, icon: ShoppingCart, color: 'purple', trend: '+18.1%', trendUp: true },
          { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'orange', trend: '+24.8%', trendUp: true },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="glass-card group border-white/5 relative overflow-hidden"
          >
            {/* Subtle bg glow */}
            <div className={cn(
               "absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40",
               stat.color === 'emerald' && "bg-emerald-500",
               stat.color === 'blue' && "bg-blue-500",
               stat.color === 'purple' && "bg-purple-500",
               stat.color === 'orange' && "bg-orange-500",
            )} />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl group-hover:scale-110 group-hover:rotate-3",
                stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white",
                stat.color === 'blue' && "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white",
                stat.color === 'purple' && "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white",
                stat.color === 'orange' && "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white",
              )}>
                <stat.icon size={28} />
              </div>
              <div className={cn(
                 "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm",
                 stat.trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              )}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                {stat.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Performance */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-2 glass-card"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Revenue Streams</h3>
              <p className="text-sm text-slate-500 font-medium">Weekly performance aggregation</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">7 Days</button>
              <button className="px-4 py-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">30 Days</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip 
                  cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Critical Alerts</h3>
              <p className="text-sm text-slate-500 font-medium">Inventory reorder signals</p>
            </div>
            <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center animate-pulse">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="space-y-6">
            {[
              { name: 'Paracetamol 500mg', stock: 12, min: 50 },
              { name: 'Amoxicillin 250mg', stock: 8, min: 30 },
              { name: 'Cough Syrup (Benadryl)', stock: 5, min: 20 },
              { name: 'Insulin Glargine', stock: 3, min: 10 },
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-end mb-2">
                   <h4 className="text-xs font-black text-white uppercase tracking-wider">{item.name}</h4>
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{item.stock} LEFT</span>
                </div>
                <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(item.stock / item.min) * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" 
                   />
                </div>
                <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tighter">Threshold: {item.min} Units / Refill Required</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.2em] transition-all">
            Open Inventory Logs
          </button>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card border-white/5 p-0 overflow-hidden"
      >
        <div className="p-10 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-1">Transaction Ledger</h3>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Most recent medical store invoices</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center gap-3">
            <ShoppingCart size={18} />
            Generate New Bill
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-10 py-5">Protocol ID</th>
                <th className="px-10 py-5">Personnel/Entity</th>
                <th className="px-10 py-5">Verification</th>
                <th className="px-10 py-5 text-center">Timestamp</th>
                <th className="px-10 py-5 text-right">Value (INR)</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentBills.length > 0 ? recentBills.map((bill, i) => (
                <tr key={bill.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-10 py-6 font-black text-emerald-500 tracking-widest text-xs uppercase">{bill.billNumber}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-white text-sm uppercase tracking-wide">{bill.customerName}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">{bill.paymentMethod.toUpperCase()} TRANSACTION</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Authorized
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    {bill.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-white text-base">
                    ₹{bill.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="p-3 bg-white/5 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-xl transition-all group-hover:scale-110">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                [1, 2, 3].map(i => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6 font-black text-emerald-500 tracking-widest text-xs uppercase">MED-ORD-0000{i}</td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-sm uppercase tracking-wide">SECURE_CLIENT_0{i}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-1">UPI_TRANSACTION</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Authorized
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">14 MAY 2026</td>
                    <td className="px-10 py-6 text-right font-black text-white text-base">₹0.00</td>
                    <td className="px-10 py-6 text-right">
                      <button className="p-3 bg-white/5 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-xl transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
