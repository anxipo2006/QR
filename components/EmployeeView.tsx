import React, { useState, useEffect, useCallback } from 'react';
import QrScanner from './QrScanner';
import { User, LogEntry, QR_CODE_VALUE } from '../types';

interface EmployeeViewProps {
  currentUser: User;
  logs: LogEntry[];
  onCheckIn: () => Promise<{success: boolean; message: string}>;
}

const StatusPill: React.FC<{ status: 'success' | 'error' | 'info', message: string, onDismiss: () => void }> = ({ status, message, onDismiss }) => {
    const baseClasses = "fixed top-24 left-1/2 -translate-x-1/2 max-w-md w-full p-4 rounded-lg shadow-lg text-white font-semibold text-center z-50 transition-all duration-300";
    const statusClasses = {
        success: 'bg-brand-secondary',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`${baseClasses} ${statusClasses[status]}`} onClick={onDismiss}>
            {message}
        </div>
    );
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({ currentUser, logs, onCheckIn }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState<{ status: 'success' | 'error' | 'info', message: string } | null>(null);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setIsScanning(false);
    if (decodedText !== QR_CODE_VALUE) {
        setNotification({ status: 'error', message: "Invalid QR Code. Please scan the official TimeGuard code."});
        return;
    }

    setNotification({ status: 'info', message: "Processing... Please wait."});
    const result = await onCheckIn();

    if(result.success) {
        setNotification({ status: 'success', message: result.message });
    } else {
        setNotification({ status: 'error', message: result.message });
    }
  }, [onCheckIn]);

  const handleScanFailure = useCallback((error: string) => {
    console.error('QR Scan Error:', error);
    setNotification({ status: 'error', message: error });
    setIsScanning(false);
  }, []);

  const employeeLogs = logs.filter(log => log.userId === currentUser.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-4 md:p-8 space-y-8">
        {notification && <StatusPill status={notification.status} message={notification.message} onDismiss={() => setNotification(null)} />}
        
        <div className="max-w-xl mx-auto">
             <div className="bg-neutral-800 p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-2">Welcome, {currentUser.name}!</h2>
                <p className="text-neutral-300 mb-6">Ready to clock in or out?</p>
                
                 <p className="mb-6 text-lg">
                    Current Status: 
                    <span className={`font-bold ml-2 ${currentUser.status === 'Checked In' ? 'text-brand-secondary' : 'text-neutral-200'}`}>
                        {currentUser.status}
                    </span>
                </p>

                {!isScanning ? (
                    <button
                        onClick={() => {
                            setIsScanning(true);
                            setNotification(null);
                        }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-primary text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.636 17.636l-.707-.707M12 20v-1m-6.364-1.636l.707-.707M4 12h1m1.636-6.364l.707.707" />
                        </svg>
                        Scan QR to Check {currentUser?.status === 'Checked In' ? 'Out' : 'In'}
                    </button>
                ) : (
                    <div>
                        <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={handleScanFailure} />
                        <button 
                            onClick={() => setIsScanning(false)}
                            className="mt-4 w-full px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
                        >
                            Cancel Scan
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 bg-neutral-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-white">My Attendance History</h3>
                <ul className="divide-y divide-neutral-700">
                    {employeeLogs.length > 0 ? employeeLogs.map(log => (
                        <li key={log.id} className="py-3 flex justify-between items-center">
                            <div>
                               <p className={`font-semibold ${log.type === 'in' ? 'text-green-400' : 'text-yellow-400'}`}>
                                Check {log.type === 'in' ? 'In' : 'Out'}
                               </p>
                               <p className="text-sm text-neutral-400">{new Date(log.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-sm text-neutral-200">IP: {log.ip}</p>
                               {log.location && <p className="text-sm text-brand-primary hover:underline"><a href={`https://www.google.com/maps/search/?api=1&query=${log.location.latitude},${log.location.longitude}`} target="_blank" rel="noopener noreferrer">View Location</a></p>}
                               {log.locationError && <p className="text-sm text-red-400">{log.locationError}</p>}
                            </div>
                        </li>
                    )) : (
                        <p className="text-center text-neutral-400 py-4">No records found.</p>
                    )}
                </ul>
            </div>
        </div>
    </div>
  );
};