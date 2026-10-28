import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TriggeredAlertLog } from '../types';

export interface UIContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  triggeredLogs: TriggeredAlertLog[];
  setTriggeredLogs: React.Dispatch<React.SetStateAction<TriggeredAlertLog[]>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [triggeredLogs, setTriggeredLogs] = useState<TriggeredAlertLog[]>([]);

  return (
    <UIContext.Provider value={{ searchQuery, setSearchQuery, triggeredLogs, setTriggeredLogs }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUIContext = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};
