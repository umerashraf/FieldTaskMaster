import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  ClipboardList, 
  Clock, 
  Package2, 
  Settings, 
  User,
  HelpCircle,
  Camera,
  FileCheck,
  Wrench,
  Phone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/lib/context/AppContext";

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
};

const NavItem = ({ to, icon, label, active, badge }: NavItemProps) => {
  return (
    <Link 
      href={to}
      className={cn(
        "flex items-center justify-between px-4 py-3 text-neutral-700 hover:bg-neutral-50",
        active && "bg-primary-50 border-l-4 border-primary-600 text-primary-600"
      )}
    >
      <div className="flex items-center">
        <div className={cn(
          "mr-3 text-neutral-500",
          active && "text-primary-600"
        )}>
          {icon}
        </div>
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge variant="default" className="bg-primary-600 text-white">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAppContext();

  // This would come from a real API in production
  const todaysTasks = 5;

  return (
    <aside 
      id="sidebar" 
      className="hidden md:block w-64 bg-white border-r border-neutral-200 overflow-y-auto"
    >
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary-600">FieldServe Pro</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Tech
        </Badge>
      </div>
      
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
            {user?.initials}
          </div>
          <div className="ml-3">
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-neutral-500">Field Technician</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-4">
        <div className="px-4 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Work
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
          label="My Tasks" 
          badge={todaysTasks}
          active={location.startsWith("/tasks")} 
        />
        <NavItem 
          to="/timesheets" 
          icon={<Clock className="h-5 w-5" />} 
          label="Time Tracking" 
          active={location.startsWith("/timesheets")} 
        />
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Tools
        </div>
        <NavItem 
          to="/products" 
          icon={<Package2 className="h-5 w-5" />} 
          label="Materials & Inventory" 
          active={location.startsWith("/products")} 
        />
        <NavItem 
          to="/photos" 
          icon={<Camera className="h-5 w-5" />} 
          label="Photos" 
          active={location.startsWith("/photos")} 
        />
        <NavItem 
          to="/service-sheets" 
          icon={<FileCheck className="h-5 w-5" />} 
          label="Service Sheets" 
          active={location.startsWith("/service-sheets")} 
        />
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Account
        </div>
        <NavItem 
          to="/profile" 
          icon={<User className="h-5 w-5" />} 
          label="My Profile" 
          active={location.startsWith("/profile")} 
        />
        <NavItem 
          to="/settings" 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings" 
          active={location.startsWith("/settings")} 
        />
      </nav>
      
      <div className="p-4 mt-4">
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <Wrench className="h-5 w-5 text-orange-600" />
            <h3 className="ml-2 text-sm font-medium text-orange-800">Technician Support</h3>
          </div>
          <p className="mt-2 text-xs text-orange-700">Need help with a difficult job or equipment issue?</p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 bg-white border border-orange-300 hover:bg-orange-50 transition-colors text-orange-700 py-2 px-3 rounded text-xs font-medium flex items-center justify-center">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </button>
            <button className="flex-1 bg-orange-600 text-white py-2 px-3 rounded text-xs font-medium hover:bg-orange-700 transition-colors flex items-center justify-center">
              <Phone className="h-3 w-3 mr-1" />
              Call
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
