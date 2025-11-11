import React, { useState } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { User, LogEntry, QR_CODE_VALUE, UserRole } from '../types';
import { TimesheetView } from './TimesheetView'; // Import the new component

// --- User Management Modal ---
const UserModal: React.FC<{
    user: Partial<User> | null;
    onSave: (user: User) => void;
    onClose: () => void;
    isSaving: boolean;
}> = ({ user, onSave, onClose, isSaving }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        if (!formData.name || !formData.username || (!user?.id && !formData.password)) {
            alert('Please fill all fields. Password is required for new users.');
            return;
        }
        const userToSave: User = {
            id: user?.id || `emp-${Date.now()}`,
            role: UserRole.Employee,
            status: user?.status || 'Checked Out',
            lastCheckIn: user?.lastCheckIn || null,
            ...formData,
        };
        // Don't save an empty password for existing users
        if (!formData.password && user?.id) {
            delete userToSave.password;
        }
        onSave(userToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-neutral-800 p-8 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-white">{user?.id ? 'Edit Employee' : 'Add New Employee'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required disabled={isSaving}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" required disabled={isSaving}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Password</label>
                        <input type="password" name="password" value={formData.password} placeholder={user?.id ? 'Leave blank to keep current password' : ''} className="mt-1 w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white" disabled={isSaving} />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-500" disabled={isSaving}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Component ---
interface AdminDashboardProps {
  users: User[];
  logs: LogEntry[];
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

type AdminTab = 'timesheet' | 'management' | 'status';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, logs, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('timesheet');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveUser = async (user: User) => {
    setIsSaving(true);
    try {
        if (users.some(u => u.id === user.id)) {
            await onUpdateUser(user);
        } else {
            await onAddUser(user);
        }
        setEditingUser(null);
    } catch (error) {
        console.error("Failed to save user:", error);
        alert("An error occurred while saving the user. Please try again.");
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDelete = async (userId: string, userName: string) => {
      if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
          try {
              await onDeleteUser(userId);
          } catch(error) {
              console.error("Failed to delete user:", error);
              alert("An error occurred while deleting the user. Please try again.");
          }
      }
  }

  const TabButton: React.FC<{tabName: AdminTab; label: string}> = ({tabName, label}) => (
      <button
          onClick={() => setActiveTab(tabName)}
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tabName ? 'bg-brand-primary text-white' : 'text-neutral-300 hover:bg-neutral-700'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity" onClick={() => setShowQrModal(false)}>
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-neutral-900">Scan to Check In/Out</h2>
            <div className="p-4 border-4 border-brand-primary rounded-lg inline-block">
                <QRCode value={QR_CODE_VALUE} size={256} />
            </div>
            <p className="mt-4 text-neutral-600">Employees can scan this code with their device.</p>
            <button onClick={() => setShowQrModal(false)} className="mt-6 px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">Close</button>
          </div>
        </div>
      )}

      {editingUser && <UserModal user={editingUser} onSave={handleSaveUser} onClose={() => setEditingUser(null)} isSaving={isSaving}/>}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
        <button onClick={() => setShowQrModal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Show Daily QR Code
        </button>
      </div>

       {/* Tab Navigation */}
      <div className="bg-neutral-800 p-2 rounded-lg shadow-inner flex items-center justify-center md:justify-start gap-2">
          <TabButton tabName="timesheet" label="Timesheet Report" />
          <TabButton tabName="management" label="Employee Management" />
          <TabButton tabName="status" label="Status & Logs" />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'timesheet' && <TimesheetView users={users} logs={logs} />}

        {activeTab === 'management' && (
            <div className="bg-neutral-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Employee Management</h3>
                    <button onClick={() => setEditingUser({})} className="px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-emerald-600 transition text-sm">Add Employee</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Username</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-neutral-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-700">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3 text-sm text-white">{user.name}</td>
                                    <td className="px-4 py-3 text-sm text-neutral-300">{user.username}</td>
                                    <td className="px-4 py-3 text-sm space-x-2">
                                        <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDelete(user.id, user.name)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {activeTab === 'status' && (
            <div className="space-y-8">
                {/* Employee Status */}
                <div className="bg-neutral-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-white">Employee Status</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-neutral-900 p-4 rounded-lg flex items-center justify-between">
                        <span className="font-medium text-white">{user.name}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Checked In' ? 'bg-green-500 text-white' : 'bg-neutral-700 text-neutral-200'}`}>
                            {user.status}
                        </span>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Attendance Log */}
                <div className="bg-neutral-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-white">Full Attendance Log</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-700">
                            <thead className="bg-neutral-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">Employee</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">Time</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">IP Address</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-200 uppercase tracking-wider">Location</th>
                                </tr>
                            </thead>
                            <tbody className="bg-neutral-900 divide-y divide-neutral-800">
                                {logs.length > 0 ? logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{log.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                Check {log.type === 'in' ? 'In' : 'Out'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">{log.ip}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-200">
                                        {log.location ? (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${log.location.latitude},${log.location.longitude}`} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                                            View Map
                                            </a>
                                        ) : (
                                            <span className="text-red-400">{log.locationError || 'Not available'}</span>
                                        )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-400">No attendance records yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};