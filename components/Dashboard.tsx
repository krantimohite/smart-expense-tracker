'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart as PieIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalSpending = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const currentMonth = new Date();
  const currentMonthSpending = expenses
    .filter(e => isWithinInterval(new Date(e.date), { 
      start: startOfMonth(currentMonth), 
      end: endOfMonth(currentMonth) 
    }))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const lastMonth = subMonths(currentMonth, 1);
  const lastMonthSpending = expenses
    .filter(e => isWithinInterval(new Date(e.date), { 
      start: startOfMonth(lastMonth), 
      end: endOfMonth(lastMonth) 
    }))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const spendingDiff = lastMonthSpending === 0 ? 0 : ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;

  const categoryData = expenses.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  const dailyData = expenses.slice(0, 30).reduce((acc: any[], curr) => {
    const date = format(new Date(curr.date), 'MMM dd');
    const existing = acc.find(a => a.date === date);
    if (existing) {
      existing.amount += curr.amount;
    } else {
      acc.push({ date, amount: curr.amount });
    }
    return acc;
  }, []).reverse();

  if (loading) return <div className="flex justify-center p-12"><TrendingUp className="animate-bounce text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            {spendingDiff !== 0 && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${spendingDiff > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {spendingDiff > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(spendingDiff).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-stone-500 text-sm font-medium">Monthly Spending</p>
          <h3 className="text-3xl font-bold text-stone-900 mt-1">${currentMonthSpending.toLocaleString()}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-sm font-medium">Total Expenses</p>
          <h3 className="text-3xl font-bold text-stone-900 mt-1">{expenses.length}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <PieIcon size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-sm font-medium">Top Category</p>
          <h3 className="text-3xl font-bold text-stone-900 mt-1">
            {categoryData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
          </h3>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100">
          <h3 className="text-lg font-bold text-stone-900 mb-6">Spending Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100">
          <h3 className="text-lg font-bold text-stone-900 mb-6">Category Breakdown</h3>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 pr-4">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-medium text-stone-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Recent Transactions</h3>
          <button className="text-sm text-emerald-600 font-semibold hover:underline">View All</button>
        </div>
        <div className="divide-y divide-stone-50">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">{expense.notes || expense.category}</p>
                  <p className="text-xs text-stone-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-stone-900">-${expense.amount.toFixed(2)}</p>
                <p className="text-xs text-stone-400">{expense.category}</p>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="p-12 text-center text-stone-400">
              No transactions yet. Start by adding one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
