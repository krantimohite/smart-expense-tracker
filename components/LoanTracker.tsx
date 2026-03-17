'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, increment } from 'firebase/firestore';
import { CreditCard, Calendar, AlertCircle, Plus, Trash2, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addMonths, isAfter, isBefore, startOfDay } from 'date-fns';

export default function LoanTracker() {
  const [loans, setLoans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [dueDate, setDueDate] = useState('1');

  useEffect(() => {
    if (!auth.currentUser) return;

    const qLoans = query(
      collection(db, 'loans'),
      where('userId', '==', auth.currentUser.uid)
    );

    const qPayments = query(
      collection(db, 'loanPayments'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubLoans = onSnapshot(qLoans, (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubLoans();
      unsubPayments();
    };
  }, []);

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !name || !totalAmount || !emiAmount) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'loans'), {
        userId: auth.currentUser.uid,
        name,
        totalAmount: parseFloat(totalAmount),
        emiAmount: parseFloat(emiAmount),
        dueDate: parseInt(dueDate),
        remainingBalance: parseFloat(totalAmount),
        status: 'active',
        createdAt: serverTimestamp(),
      });
      setName('');
      setTotalAmount('');
      setEmiAmount('');
      setShowAdd(false);
    } catch (error) {
      console.error("Error adding loan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayEMI = async (loan: any) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const paymentAmount = Math.min(loan.emiAmount, loan.remainingBalance);
      
      // Add payment record
      await addDoc(collection(db, 'loanPayments'), {
        userId: auth.currentUser.uid,
        loanId: loan.id,
        amount: paymentAmount,
        date: new Date().toISOString(),
      });

      // Update loan balance
      const newBalance = loan.remainingBalance - paymentAmount;
      await updateDoc(doc(db, 'loans', loan.id), {
        remainingBalance: newBalance,
        status: newBalance <= 0 ? 'completed' : 'active'
      });

      // Also add to expenses
      await addDoc(collection(db, 'expenses'), {
        userId: auth.currentUser.uid,
        amount: paymentAmount,
        category: 'Bills',
        notes: `EMI Payment: ${loan.name}`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error paying EMI:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoan = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'loans', id));
    } catch (error) {
      console.error("Error deleting loan:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Loan Tracking</h2>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2"
        >
          {showAdd ? 'Cancel' : <><Plus size={18} /> Add Loan</>}
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100"
        >
          <form onSubmit={handleAddLoan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Loan Name</label>
              <input
                type="text"
                placeholder="e.g., Home Loan, Car Loan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Monthly EMI</label>
              <input
                type="number"
                placeholder="0.00"
                value={emiAmount}
                onChange={(e) => setEmiAmount(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Due Date (Day of Month)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 transition-all"
              >
                {loading ? 'Adding...' : 'Save Loan Details'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.map((loan) => {
          const progress = ((loan.totalAmount - loan.remainingBalance) / loan.totalAmount) * 100;
          const isDueSoon = parseInt(dueDate) - new Date().getDate() <= 5 && parseInt(dueDate) >= new Date().getDate();
          
          return (
            <motion.div 
              key={loan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`bg-white p-6 rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 relative group ${loan.status === 'completed' ? 'opacity-75' : ''}`}
            >
              <button 
                onClick={() => handleDeleteLoan(loan.id)}
                className="absolute top-4 right-4 p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{loan.name}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${loan.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {loan.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500">Remaining Balance</p>
                  <p className="text-xl font-bold text-stone-900">${loan.remainingBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-stone-50">
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Monthly EMI</p>
                    <p className="font-bold text-stone-800">${loan.emiAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase">Due Date</p>
                    <p className="font-bold text-stone-800">{loan.dueDate}th of month</p>
                  </div>
                </div>

                {loan.status === 'active' && (
                  <div className="flex items-center justify-between gap-4">
                    {isDueSoon ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl flex-1">
                        <AlertCircle size={14} />
                        EMI Due Soon!
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-400 bg-stone-50 px-3 py-2 rounded-xl flex-1">
                        <Calendar size={14} />
                        Next EMI: {loan.dueDate}th
                      </div>
                    )}
                    <button 
                      onClick={() => handlePayEMI(loan)}
                      disabled={loading}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-all flex items-center gap-2"
                    >
                      Pay EMI <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {loan.status === 'completed' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 size={14} />
                    Loan fully cleared!
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {loans.length === 0 && !showAdd && (
          <div className="lg:col-span-2 p-12 text-center text-stone-400 bg-white rounded-3xl border border-dashed border-stone-200">
            No active loans. Click &quot;Add Loan&quot; to start tracking.
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg shadow-stone-200/50 border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center gap-2">
            <History size={20} className="text-stone-400" />
            <h3 className="text-lg font-bold text-stone-900">EMI Payment History</h3>
          </div>
          <div className="divide-y divide-stone-50">
            {payments.slice(0, 10).map((payment) => {
              const loan = loans.find(l => l.id === payment.loanId);
              return (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{loan?.name || 'Loan Payment'}</p>
                      <p className="text-xs text-stone-500">{format(new Date(payment.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">-${payment.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">EMI Paid</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
