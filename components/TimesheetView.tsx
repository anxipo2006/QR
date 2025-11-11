import React, { useState, useMemo } from 'react';
import { User, LogEntry } from '../types';

interface TimesheetData {
  [userId: string]: {
    [date: string]: {
      checkIn: Date | null;
      checkOut: Date | null;
      duration: number; // in hours
    };
  };
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const formatTime = (date: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const TimesheetView: React.FC<{ users: User[], logs: LogEntry[] }> = ({ users, logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const processedData = useMemo<TimesheetData>(() => {
    const data: TimesheetData = {};
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= weekStart && logDate <= weekEnd;
    });

    for (const user of users) {
      data[user.id] = {};
    }

    for (const log of filteredLogs) {
      if (!data[log.userId]) continue;

      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      if (!data[log.userId][dateKey]) {
        data[log.userId][dateKey] = { checkIn: null, checkOut: null, duration: 0 };
      }

      const logDate = new Date(log.timestamp);
      const entry = data[log.userId][dateKey];

      if (log.type === 'in' && (!entry.checkIn || logDate < entry.checkIn)) {
        entry.checkIn = logDate;
      }
      if (log.type === 'out' && (!entry.checkOut || logDate > entry.checkOut)) {
        entry.checkOut = logDate;
      }
    }
     
    // Calculate duration
    for (const userId in data) {
        for (const dateKey in data[userId]) {
            const entry = data[userId][dateKey];
            if (entry.checkIn && entry.checkOut) {
                const durationMs = entry.checkOut.getTime() - entry.checkIn.getTime();
                entry.duration = durationMs / (1000 * 60 * 60);
            }
        }
    }

    return data;
  }, [logs, users, weekStart, weekEnd]);
  
  const handleExport = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Employee Name,Date,Check In,Check Out,Total Hours Worked\n";

      users.forEach(user => {
          daysOfWeek.forEach(day => {
              const dateKey = day.toISOString().split('T')[0];
              const entry = processedData[user.id]?.[dateKey];
              
              if (entry) {
                  const checkInTime = entry.checkIn ? formatTime(entry.checkIn) : '';
                  const checkOutTime = entry.checkOut ? formatTime(entry.checkOut) : '';
                  const duration = entry.duration.toFixed(2);
                  csvContent += `${user.name},${dateKey},${checkInTime},${checkOutTime},${duration}\n`;
              }
          });
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `timesheet_${weekStart.toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const changeWeek = (direction: 'prev' | 'next') => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
      setCurrentDate(newDate);
  }

  return (
    <div className="bg-neutral-800 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
            <button onClick={() => changeWeek('prev')} className="p-2 rounded-md bg-neutral-700 hover:bg-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-semibold text-lg text-white">
                {weekStart.toLocaleDateString('vi-VN')} - {weekEnd.toLocaleDateString('vi-VN')}
            </span>
             <button onClick={() => changeWeek('next')} className="p-2 rounded-md bg-neutral-700 hover:bg-neutral-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
        <button onClick={handleExport} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-emerald-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-neutral-700">
          <thead className="bg-neutral-900">
            <tr>
              <th className="p-3 text-left font-semibold text-white border border-neutral-700">Employee</th>
              {daysOfWeek.map((day, index) => (
                <th key={day.toISOString()} className="p-3 text-center font-semibold text-white border border-neutral-700">
                  {dayLabels[index]}<br />
                  <span className="font-normal text-sm text-neutral-400">{day.getDate()}/{day.getMonth() + 1}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="bg-neutral-800 even:bg-neutral-900/50">
                <td className="p-3 font-medium text-white border border-neutral-700 min-w-[150px]">{user.name}</td>
                {daysOfWeek.map(day => {
                  const dateKey = day.toISOString().split('T')[0];
                  const entry = processedData[user.id]?.[dateKey];
                  const hasCheckIn = !!entry?.checkIn;
                  const hasCheckOut = !!entry?.checkOut;

                  let cellClass = 'bg-neutral-700 text-neutral-400';
                  if (hasCheckIn && hasCheckOut) {
                    cellClass = 'bg-blue-900/50 border-blue-500 text-white';
                  } else if (hasCheckIn || hasCheckOut) {
                    cellClass = 'bg-yellow-900/50 border-yellow-500 text-white';
                  }
                  
                  return (
                    <td key={dateKey} className={`p-3 text-center border border-neutral-700 min-w-[120px]`}>
                       <div className={`p-2 rounded-md ${cellClass} border-l-4`}>
                          <p className="font-semibold text-sm">Chấm công</p>
                          <p className="text-xs font-mono tracking-tighter">
                            {hasCheckIn ? formatTime(entry.checkIn) : '-'}
                            {hasCheckOut ? ` - ${formatTime(entry.checkOut)}` : (hasCheckIn ? ' -' : '')}
                           </p>
                       </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <div className="flex justify-end items-center gap-4 mt-4 text-sm text-neutral-400">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-900/50 border border-blue-500"></div><span>Checked In & Out</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-yellow-900/50 border border-yellow-500"></div><span>Incomplete</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-neutral-700"></div><span>No Record</span></div>
      </div>
    </div>
  );
};
