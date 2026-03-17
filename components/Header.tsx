'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, LogOut, Wallet } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState(auth.currentUser);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setImgError(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => signOut(auth);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Wallet size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">SmartExpense</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-stone-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-stone-900">{user.displayName || 'User'}</p>
                <p className="text-xs text-stone-500">{user.email}</p>
              </div>
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
                {user.photoURL && !imgError ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-sm font-bold text-stone-400">
                    {getInitials(user.displayName)}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
