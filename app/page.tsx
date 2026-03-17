'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import Header from '@/components/Header';
import Auth from '@/components/Auth';
import Dashboard from '@/components/Dashboard';
import ExpenseForm from '@/components/ExpenseForm';
import BudgetManager from '@/components/BudgetManager';
import LoanTracker from '@/components/LoanTracker';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LayoutDashboard, Receipt, Target, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'loans', label: 'Loans', icon: CreditCard },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 pb-24 lg:pb-0">
        <Header />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation (Desktop) */}
            <aside className="hidden lg:block w-64 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-stone-900 text-white shadow-lg shadow-stone-200' 
                      : 'text-stone-500 hover:bg-white hover:text-stone-900'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
              
              <div className="mt-8 p-6 bg-emerald-600 rounded-3xl text-white relative overflow-hidden">
                <Sparkles className="absolute -top-2 -right-2 opacity-20" size={80} />
                <h4 className="font-bold relative z-10">AI Insights</h4>
                <p className="text-xs text-emerald-100 mt-2 relative z-10 leading-relaxed">
                  Your spending is 12% lower than last month. Keep it up!
                </p>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-3xl font-bold text-stone-900">Financial Overview</h1>
                          <p className="text-stone-500">Track your spending and manage your wealth.</p>
                        </div>
                      </div>
                      <Dashboard />
                    </div>
                  )}

                  {activeTab === 'expenses' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-stone-900">Expenses</h1>
                      <div className="grid grid-cols-1 gap-8">
                        <ExpenseForm />
                        {/* We reuse the transaction list from Dashboard here or create a dedicated one */}
                        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 p-6">
                          <h3 className="text-lg font-bold text-stone-900 mb-4">Transaction History</h3>
                          <p className="text-stone-500 text-sm">Detailed view of all your spending records.</p>
                          {/* In a real app, we'd add filters and pagination here */}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'budgets' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-stone-900">Budget Planning</h1>
                      <BudgetManager />
                    </div>
                  )}

                  {activeTab === 'loans' && (
                    <div className="space-y-8">
                      <h1 className="text-3xl font-bold text-stone-900">Loan Management</h1>
                      <LoanTracker />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-6 py-3 flex justify-between items-center z-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id ? 'text-emerald-600' : 'text-stone-400'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </ErrorBoundary>
  );
}
