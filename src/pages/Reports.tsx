import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  FileText,
  Share2,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bill } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

const profitData = [
  { day: 'Mon', revenue: 4500, profit: 1200 },
  { day: 'Tue', revenue: 5200, profit: 1400 },
  { day: 'Wed', revenue: 3800, profit: 900 },
  { day: 'Thu', revenue: 6100, profit: 1800 },
  { day: 'Fri', revenue: 4900, profit: 1300 },
  { day: 'Sat', revenue: 7200, profit: 2100 },
  { day: 'Sun', revenue: 5800, profit: 1600 },
];

export default function Reports() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      const q = query(collection(db, 'bills'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
      setBills(docs);
      setLoading(false);
    };
    fetchBills();
  }, []);

  const totalSales = bills.reduce((acc, b) => acc + b.finalAmount, 0);
  const totalOrders = bills.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Comprehensive overview of your pharmacy's financial performance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold shadow-sm">
            <Calendar size={18} /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none">
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${totalSales.toLocaleString()}`, trend: '+14.5%', icon: TrendingUp, color: 'emerald' },
          { label: 'Total Invoices', value: totalOrders, trend: '+8.2%', icon: FileText, color: 'blue' },
          { label: 'Average Order', value: `₹${Math.round(avgOrderValue).toLocaleString()}`, trend: '-2.4%', icon: BarChart3, color: 'purple' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="glass p-8 rounded-3xl shadow-sm relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                stat.color === 'emerald' && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
                stat.color === 'purple' && "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
              )}>
                <stat.icon size={24} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black">{stat.value}</h3>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                {stat.trend.startsWith('+') ? (
                  <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full"><ArrowUpRight size={14}/> {stat.trend}</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full"><ArrowDownRight size={14}/> {stat.trend}</span>
                )}
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Profit Chart */}
        <div className="glass p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black mb-1">Financial Performance</h3>
              <p className="text-sm text-slate-500">Revenue and profit analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                <span className="text-xs font-bold text-slate-500">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-bold text-slate-500">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Pie Chart */}
        <div className="glass p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black mb-1">Sales by Category</h3>
              <p className="text-sm text-slate-500">Distribution of product sales</p>
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
          <div className="h-[350px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Antibiotics', value: 450 },
                    { name: 'Pain Relief', value: 300 },
                    { name: 'Cardio', value: 200 },
                    { name: 'Vitamins', value: 150 },
                    { name: 'Others', value: 100 },
                  ]}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {[1, 2, 3, 4, 5].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black">1.2k</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Units</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {['Antibiotics', 'Pain Relief', 'Cardio', 'Vitamins', 'Others'].map((cat, i) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-xs font-bold text-slate-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Sales Data */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-black">Sales Ledger</h3>
          <div className="flex gap-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Find invoice..." 
                className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none w-48"
              />
            </div>
            <button className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400"><Filter size={18} /></button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Invoice ID</th>
                <th className="px-8 py-5">Customer</th>
                <th className="px-8 py-5">Items</th>
                <th className="px-8 py-5 text-right">Revenue</th>
                <th className="px-8 py-5 text-right">Tax (GST)</th>
                <th className="px-8 py-5 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5 text-sm text-slate-500">{bill.createdAt.toDate().toLocaleDateString()}</td>
                  <td className="px-8 py-5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">#{bill.billNumber}</td>
                  <td className="px-8 py-5 font-bold text-sm">{bill.customerName}</td>
                  <td className="px-8 py-5 text-sm">{bill.items.length} Medicines</td>
                  <td className="px-8 py-5 text-right font-black text-sm">₹{bill.finalAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right text-sm text-slate-400">₹{bill.gstAmount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-bold text-emerald-600 text-sm">₹{Math.round(bill.totalAmount * 0.25).toLocaleString()}</td>
                </tr>
              ))}
              {bills.length === 0 && [1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                  <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                  <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32"></div></td>
                  <td className="px-8 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                  <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                  <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16 ml-auto"></div></td>
                  <td className="px-8 py-5 text-right"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
