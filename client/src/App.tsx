import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/context/AppContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import TasksList from "@/pages/TasksList";
import NewTask from "@/pages/NewTask";
import EditTask from "@/pages/EditTask";
import TaskDetail from "@/pages/TaskDetail";
import Timesheets from "@/pages/Timesheets";
import Products from "@/pages/Products";
import Calendar from "@/pages/Calendar";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Notifications from "@/components/layout/Notifications";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/tasks" component={TasksList} />
            <Route path="/tasks/new" component={NewTask} />
            <Route path="/tasks/:id/edit" component={EditTask} />
            <Route path="/tasks/:id" component={TaskDetail} />
            <Route path="/timesheets" component={Timesheets} />
            <Route path="/products" component={Products} />
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      <MobileNavigation />
    </div>
  );
}

function App() {
  // Setup initial user for demo purposes
  const [currentUser] = useState({
    id: 1,
    name: "John Smith",
    username: "john.smith",
    initials: "JS",
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider value={{ user: currentUser }}>
            <Toaster />
            <Router />
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
