import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UIContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  triggeredLogs: any[];
  setTriggeredLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [triggeredLogs, setTriggeredLogs] = useState<any[]>([]);

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
