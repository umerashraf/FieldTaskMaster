import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  ClipboardList, 
  Clock, 
  Package2, 
  Settings, 
  User,
  HelpCircle
} from "lucide-react";

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const NavItem = ({ to, icon, label, active }: NavItemProps) => {
  return (
    <Link 
      href={to}
      className={cn(
        "flex items-center px-4 py-3 text-neutral-700 hover:bg-neutral-50",
        active && "bg-primary-50 border-l-4 border-primary-600 text-primary-600"
      )}
    >
      <div className={cn(
        "mr-3 text-neutral-500",
        active && "text-primary-600"
      )}>
        {icon}
      </div>
      {label}
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside 
      id="sidebar" 
      className="hidden md:block w-64 bg-white border-r border-neutral-200 overflow-y-auto"
    >
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-primary-600">FieldServe Pro</h1>
      </div>
      
      <nav className="mt-4">
        <div className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Main
        </div>
        <NavItem 
          to="/" 
          icon={<Home className="h-5 w-5" />} 
          label="Dashboard" 
          active={location === "/" || location === ""} 
        />
        <NavItem 
          to="/tasks" 
          icon={<ClipboardList className="h-5 w-5" />} 
          label="Tasks" 
          active={location.startsWith("/tasks")} 
        />
        <NavItem 
          to="/timesheets" 
          icon={<Clock className="h-5 w-5" />} 
          label="Timesheets" 
          active={location.startsWith("/timesheets")} 
        />
        <NavItem 
          to="/products" 
          icon={<Package2 className="h-5 w-5" />} 
          label="Products" 
          active={location.startsWith("/products")} 
        />
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Settings
        </div>
        <NavItem 
          to="/settings" 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          active={location.startsWith("/settings")} 
        />
        <NavItem 
          to="/profile" 
          icon={<User className="h-5 w-5" />} 
          label="Profile" 
          active={location.startsWith("/profile")} 
        />
      </nav>
      
      <div className="p-4 mt-8">
        <div className="bg-primary-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-primary-800">Need help?</h3>
          <p className="mt-1 text-xs text-primary-600">Contact support for assistance with your field service needs.</p>
          <button className="mt-3 w-full bg-primary-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-primary-700 transition duration-150 ease-in-out flex items-center justify-center">
            <HelpCircle className="h-4 w-4 mr-1" />
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  );
}
