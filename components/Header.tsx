import React from 'react';
import { User } from '../types';

interface HeaderProps {
  loggedInUser: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ loggedInUser, onLogout }) => {
  return (
    <header className="bg-neutral-800 p-4 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          <h1 className="text-2xl font-bold text-white">TimeGuard</h1>
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-neutral-200 hidden sm:block">Welcome, <span className="font-bold">{loggedInUser.name}</span></span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white font-semibold rounded-lg shadow-md hover:bg-neutral-600 transition"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
            </button>
        </div>
      </div>
    </header>
  );
};