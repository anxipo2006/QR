export enum UserRole {
  Admin = 'ADMIN',
  Employee = 'EMPLOYEE',
}

export interface User {
  id: string;
  name:string;
  username: string;
  password?: string; // Password is optional for client-side representation
  role: UserRole;
  status: 'Checked In' | 'Checked Out';
  lastCheckIn: Date | null;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  type: 'in' | 'out';
  ip: string;
  location: GeolocationData | null;
  locationError?: string;
}

export const QR_CODE_VALUE = '{"companyId": "TimeGuard-Demo", "action": "attendance-scan"}';