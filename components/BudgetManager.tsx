'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Target, AlertCircle, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('Food');
  const [newLimit, setNewLimit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qBudgets = query(
      collection(db, 'budgets'),
      where('userId', '==', auth.currentUser.uid)
    );

    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubBudgets();
      unsubExpenses();
    };
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newLimit) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'budgets'), {
        userId: auth.currentUser.uid,
        category: newCategory,
        limit: parseFloat(newLimit),
        month: format(new Date(), 'yyyy-MM'),
        createdAt: serverTimestamp(),
      });
      setNewLimit('');
    } catch (error) {
      console.error("Error adding budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const getCategorySpending = (category: string) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return expenses
      .filter(e => e.category === category && format(new Date(e.date), 'yyyy-MM') === currentMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 p-6 border border-stone-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Target size={20} />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Set Monthly Budget</h2>
        </div>

        <form onSubmit={handleAddBudget} className="flex flex-col sm:flex-row gap-4">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Health">Health</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Others">Others</option>
          </select>
          <input
            type="number"
            placeholder="Limit Amount"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !newLimit}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={20} />
            Set
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const spending = getCategorySpending(budget.category);
          const percent = Math.min((spending / budget.limit) * 100, 100);
          const isOver = spending > budget.limit;
          const isNear = spending > budget.limit * 0.8 && !isOver;

          return (
            <motion.div 
              key={budget.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 relative group"
            >
              <button 
                onClick={() => handleDeleteBudget(budget.id)}
                className="absolute top-4 right-4 p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-stone-900">{budget.category}</h3>
                <span className="text-sm font-medium text-stone-500">
                  ${spending.toFixed(2)} / ${budget.limit.toFixed(2)}
                </span>
              </div>

              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className={`h-full rounded-full ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
              </div>

              {isOver && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle size={14} />
                  Budget limit exceeded!
                </div>
              )}
              {isNear && (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <AlertCircle size={14} />
                  Approaching budget limit (80%+)
                </div>
              )}
              {!isOver && !isNear && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                  <CheckCircle2 size={14} />
                  Spending is within budget
                </div>
              )}
            </motion.div>
          );
        })}
        {budgets.length === 0 && (
          <div className="md:col-span-2 p-12 text-center text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">
            No budgets set for this month.
          </div>
        )}
      </div>
    </div>
  );
}
