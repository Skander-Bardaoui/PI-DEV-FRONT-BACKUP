import React, { useEffect, useState } from 'react';
import { usePresence } from '../hooks/usePresence';

interface PresenceTestProps {
  businessId: string;
  token: string;
}

export const PresenceTest: React.FC<PresenceTestProps> = ({ businessId, token }) => {
  const { onlineUsers, userStatuses, isConnected } = usePresence(businessId, token);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
  }, [isConnected]);

  useEffect(() => {
    addLog(`Online users updated: ${onlineUsers.length} users`);
  }, [onlineUsers]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Presence System Test</h3>
      
      <div className="mb-4">
        <div className={`inline-block px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">Online Users ({onlineUsers.length}):</h4>
        <div className="text-sm">
          {onlineUsers.length > 0 ? (
            onlineUsers.map(userId => (
              <div key={userId} className="text-green-600">• {userId}</div>
            ))
          ) : (
            <div className="text-gray-500">No users online</div>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold">Connection Logs:</h4>
        <div className="text-xs bg-black text-green-400 p-2 rounded max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};