import React, { createContext, useContext, useState } from 'react';

// --------------------
// Global Alert Context
// --------------------
// Provides a global alert system for the app
interface AlertContextType {
  showAlert: (message: string, type?: 'success' | 'error' | 'info') => void;
}
const AlertContext = createContext<AlertContextType>({ showAlert: () => {} });
export const useAlert = () => useContext(AlertContext);

// AlertProvider component to wrap your app (put in main.tsx or App.tsx)
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(null);
  // Show alert for 2.5s
  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2500);
  };
  
  const getAlertStyle = (type: string) => {
    const baseStyle = {
      position: 'fixed' as const,
      top: 24,
      right: 24,
      left: 'auto' as const,
      transform: 'none' as const,
      color: '#fff',
      padding: '12px 32px',
      borderRadius: 'var(--radius-md)',
      fontWeight: 600,
      fontSize: 16,
      zIndex: 2000,
      boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
      border: '1px solid var(--border-primary)',
      transition: 'var(--transition-base)'
    };

    switch (type) {
      case 'error':
        return {
          ...baseStyle,
          background: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          ...baseStyle,
          background: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.3)'
        };
      default:
        return {
          ...baseStyle,
          background: 'var(--card-bg)',
          borderColor: 'var(--border-primary)'
        };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div style={getAlertStyle(alert.type)}>
          {alert.message}
        </div>
      )}
    </AlertContext.Provider>
  );
}; 