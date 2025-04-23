import { createContext, useContext, ReactNode } from "react";

type User = {
  id: number;
  name: string;
  username: string;
  initials: string;
};

type AppContextType = {
  user: User | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: AppContextType;
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  
  return context;
}
