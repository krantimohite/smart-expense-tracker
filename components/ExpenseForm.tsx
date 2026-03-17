'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, auth } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { categorizeExpense } from '@/lib/gemini';
import { Plus, Sparkles, Loader2, Calendar, Tag, DollarSign, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const expenseSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpenseForm() {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'Others',
    }
  });

  const notes = watch('notes');
  const amount = watch('amount');

  // const handleAiCategorize = async () => {
  //   if (!notes || !amount) return;
  //   setAiLoading(true);
  //   const category = await categorizeExpense(notes, amount);
  //   setValue('category', category);
  //   setAiLoading(false);
  // };
  // ⚡ CHANGED: use server API instead of direct gemini call
  const handleAiCategorize = async () => {
    if (!notes || !amount) return;
    setAiLoading(true);

    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, amount }),
      });

      const data = await res.json();
      setValue('category', data.category);
    } catch (error) {
      console.error("AI Categorization failed:", error);
      setValue('category', 'Others');
    } finally {
      setAiLoading(false);
    }
  };
  // changes

  const onSubmit = async (data: ExpenseFormValues) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        ...data,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      reset();
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 border border-stone-100"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
          <Plus size={20} />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Add Expense</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <DollarSign size={14} /> Amount
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-stone-500 flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-500 flex items-center gap-2">
            <FileText size={14} /> Notes / Description
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('notes')}
              placeholder="e.g., Lunch at Starbucks"
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-12"
            />
            <button
              type="button"
              onClick={handleAiCategorize}
              disabled={aiLoading || !notes || !amount}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-30"
              title="Auto-categorize with AI"
            >
              {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-500 flex items-center gap-2">
            <Tag size={14} /> Category
          </label>
          <select
            {...register('category')}
            className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          >
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Health">Health</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          Add Expense
        </button>
      </form>
    </motion.div>
  );
}
