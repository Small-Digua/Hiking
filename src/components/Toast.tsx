/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastComponentProps {
  message: string;
  type: ToastType;
}

export function Toast({ message, type }: ToastComponentProps) {
  return (
    <div className="z-[100] animate-toast-lifecycle">
       <div className="flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg bg-white min-w-[320px] max-w-[90vw]">
         {type === 'success' && <CheckCircle className="w-6 h-6 text-white fill-green-500" />}
         {type === 'error' && <XCircle className="w-6 h-6 text-white fill-red-500" />}
         {type === 'warning' && <AlertCircle className="w-6 h-6 text-white fill-yellow-500" />}
         {type === 'info' && <Info className="w-6 h-6 text-white fill-blue-500" />}
        
        <span className="text-sm font-medium text-gray-800 flex-1">{message}</span>
      </div>
    </div>
  )
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col gap-3 pointer-events-none items-center">
        {toasts.map((toast) => (
           <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
