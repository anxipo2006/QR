import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeView } from './components/EmployeeView';
import { UserRole, User, LogEntry, GeolocationData } from './types';
import { getGeolocation, getIpAddress } from './services/locationService';
import * as api from './services/api';

// --- Login Component ---
const Login: React.FC<{ 
    onLogin: (username: string, password: string) => Promise<void>; 
    error: string | null; 
}> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        await onLogin(username, password);
        setIsLoggingIn(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900">
            <div className="max-w-md w-full bg-neutral-800 p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-white mt-2">TimeGuard Login</h1>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full p-3 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary" required disabled={isLoggingIn} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-300">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-3 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary" required disabled={isLoggingIn} />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-3 px-4 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed" disabled={isLoggingIn}>
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-xs text-neutral-500 mt-6">Demo: admin/admin, alice/alice123, bob/bob123</p>
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load data from API on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedUsers, loadedLogs] = await Promise.all([api.getUsers(), api.getLogs()]);
        setUsers(loadedUsers);
        setLogs(loadedLogs);
        
        const sessionUser = sessionStorage.getItem('timeguard_session');
        if(sessionUser) {
            const parsedUser = JSON.parse(sessionUser);
            // Re-validate session user against latest user list
            const userExists = loadedUsers.some(u => u.id === parsedUser.id);
            if (userExists) {
                setLoggedInUser(parsedUser);
            } else {
                sessionStorage.removeItem('timeguard_session');
            }
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
        setLoginError("Could not load application data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);
  
  const handleLogin = async (username: string, password: string): Promise<void> => {
    setLoginError(null);
    try {
        const user = await api.login(username, password);
        setLoggedInUser(user);
        sessionStorage.setItem('timeguard_session', JSON.stringify(user));
    } catch (error: any) {
        setLoginError(error.message);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    sessionStorage.removeItem('timeguard_session');
  }

  const handleCheckIn = async (): Promise<{success: boolean; message: string}> => {
    if (isProcessing || !loggedInUser) {
      return { success: false, message: "Another operation is in progress or user not logged in."};
    }
    setIsProcessing(true);

    try {
      const ip = await getIpAddress();
      let location: GeolocationData | null = null;
      let locationError: string | undefined;

      try {
        location = await getGeolocation();
      } catch (error: any) {
        locationError = error.message;
      }
      
      const newStatus = loggedInUser.status === 'Checked In' ? 'Checked Out' : 'Checked In';
      const logType = newStatus === 'Checked In' ? 'in' : 'out';

      const newLog: Omit<LogEntry, 'id'> = {
        userId: loggedInUser.id,
        userName: loggedInUser.name,
        timestamp: new Date(),
        type: logType,
        ip: ip,
        location: location,
        locationError: locationError
      };
      
      const createdLog = await api.addLog(newLog);

      const updatedUser: User = { ...loggedInUser, status: newStatus, lastCheckIn: newStatus === 'Checked In' ? new Date() : loggedInUser.lastCheckIn };
      
      // Since this is a critical action for the current user, we update the user object via a dedicated call
      const savedUser = await api.updateUser(updatedUser);

      setUsers(prevUsers => prevUsers.map(u => u.id === savedUser.id ? savedUser : u));
      setLogs(prevLogs => [createdLog, ...prevLogs]);
      setLoggedInUser(savedUser);
      sessionStorage.setItem('timeguard_session', JSON.stringify(savedUser));
      
      return { success: true, message: `Successfully Checked ${logType}!`};

    } catch (error) {
      return { success: false, message: `Check-in process failed. Please try again.` };
    } finally {
        setIsProcessing(false);
    }
  };

  // --- User Management Handlers ---
  const handleAddUser = async (user: User) => {
    const newUser = await api.addUser(user);
    setUsers(prev => [...prev, newUser]);
  }
  const handleUpdateUser = async (updatedUser: User) => {
    const savedUser = await api.updateUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === savedUser.id ? savedUser : u)));
  }
  const handleDeleteUser = async (userId: string) => {
    await api.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
              <p>Loading Application...</p>
          </div>
      )
  }

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-neutral-900 font-sans">
      <Header loggedInUser={loggedInUser} onLogout={handleLogout} />
      <main className="container mx-auto">
        {loggedInUser.role === UserRole.Admin ? (
          <AdminDashboard 
            users={users.filter(u => u.role === UserRole.Employee)} 
            logs={logs}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          <EmployeeView 
            currentUser={loggedInUser} 
            logs={logs} 
            onCheckIn={handleCheckIn}
          />
        )}
      </main>
       <footer className="text-center p-4 text-neutral-500 text-sm">
        <p>TimeGuard QR Attendance &copy; {new Date().getFullYear()}. A demo application.</p>
      </footer>
    </div>
  );
}

export default App;