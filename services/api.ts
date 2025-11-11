import { User, UserRole, LogEntry } from '../types';

const USERS_KEY = 'timeguard_users';
const LOGS_KEY = 'timeguard_logs';
const API_DELAY = 500; // milliseconds to simulate network latency

// --- Helper Functions ---

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, API_DELAY));

/**
 * Initializes localStorage with mock data if it's the first time the app is run.
 */
const initializeData = () => {
    if (!localStorage.getItem(USERS_KEY)) {
        const initialUsers: User[] = [
            { id: 'admin-1', name: 'Admin User', username: 'admin', password: 'admin', role: UserRole.Admin, status: 'Checked Out', lastCheckIn: null },
            { id: 'emp-1', name: 'Alice', username: 'alice', password: 'alice123', role: UserRole.Employee, status: 'Checked Out', lastCheckIn: null },
            { id: 'emp-2', name: 'Bob', username: 'bob', password: 'bob123', role: UserRole.Employee, status: 'Checked Out', lastCheckIn: null },
            { id: 'emp-3', name: 'Charlie', username: 'charlie', password: 'charlie123', role: UserRole.Employee, status: 'Checked Out', lastCheckIn: null },
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
    }
    if (!localStorage.getItem(LOGS_KEY)) {
        localStorage.setItem(LOGS_KEY, JSON.stringify([]));
    }
};

// --- API Functions ---

// Initialize data on module load
initializeData();

/**
 * Strips the password from a user object for safe client-side handling.
 * @param user The user object.
 * @returns A new user object without the password property.
 */
const stripPassword = (user: User): User => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

/**
 * Authenticates a user.
 * In a real app, this would be a POST request to a server endpoint.
 * The server would handle password hashing and comparison.
 * @param username The user's username.
 * @param password The user's plaintext password.
 * @returns A Promise that resolves with the user object (without password) or rejects with an error.
 */
export const login = async (username: string, password: string): Promise<User> => {
    await simulateDelay();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username);

    // IMPORTANT: This is an insecure password check for demo purposes ONLY.
    // A real backend would use bcrypt.compare() or a similar secure method.
    if (user && user.password === password) {
        return stripPassword(user);
    }
    throw new Error('Invalid username or password.');
};

/**
 * Fetches all users from the database.
 * @returns A Promise that resolves with an array of all users (without passwords).
 */
export const getUsers = async (): Promise<User[]> => {
    await simulateDelay();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.map(stripPassword);
};

/**
 * Fetches all attendance logs.
 * @returns A Promise that resolves with an array of all log entries.
 */
export const getLogs = async (): Promise<LogEntry[]> => {
    await simulateDelay();
    const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    // Ensure timestamps are Date objects
    return logs.map(log => ({...log, timestamp: new Date(log.timestamp)}));
};

/**
 * Adds a new user to the database.
 * @param newUser The new user data. Password is required.
 * @returns A Promise that resolves with the newly created user (without password).
 */
export const addUser = async (newUser: User): Promise<User> => {
    await simulateDelay();
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some(u => u.username === newUser.username)) {
        throw new Error('Username already exists.');
    }
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return stripPassword(newUser);
};

/**
 * Updates an existing user.
 * @param updatedUser The user data to update.
 * @returns A Promise that resolves with the updated user (without password).
 */
export const updateUser = async (updatedUser: User): Promise<User> => {
    await simulateDelay();
    let users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let userFound = false;
    users = users.map(u => {
        if (u.id === updatedUser.id) {
            userFound = true;
            // Keep original password if new one is not provided or is empty
            const password = updatedUser.password ? updatedUser.password : u.password;
            return { ...u, ...updatedUser, password };
        }
        return u;
    });

    if (!userFound) throw new Error('User not found.');

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return stripPassword(users.find(u => u.id === updatedUser.id)!);
};

/**
 * Deletes a user from the database.
 * @param userId The ID of the user to delete.
 * @returns A Promise that resolves when the operation is complete.
 */
export const deleteUser = async (userId: string): Promise<void> => {
    await simulateDelay();
    let users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Adds a new attendance log entry.
 * @param newLog The log entry data to add (without an ID).
 * @returns A Promise that resolves with the newly created log entry (with an ID).
 */
export const addLog = async (newLog: Omit<LogEntry, 'id'>): Promise<LogEntry> => {
    await simulateDelay();
    const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    const logWithId: LogEntry = { ...newLog, id: `log-${Date.now()}`};
    logs.unshift(logWithId); // Add to the beginning of the array
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    return {...logWithId, timestamp: new Date(logWithId.timestamp)};
};
