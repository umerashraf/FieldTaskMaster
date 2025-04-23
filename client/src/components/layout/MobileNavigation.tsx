import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Clock, Plus, Package2, Camera, FileCog, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
};

const NavItem = ({ href, icon, label, active, badge }: NavItemProps) => {
  return (
    <Link href={href} className="flex flex-col items-center p-3 text-neutral-600 relative">
      {badge !== undefined && badge > 0 && (
        <Badge variant="default" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary-600 text-white">
          {badge}
        </Badge>
      )}
      <div className={cn(active && "text-primary-600")}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default function MobileNavigation() {
  const [location] = useLocation();
  
  // This would come from a real API in production
  const todaysTasks = 5;
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
      <div className="flex justify-around">
        <NavItem 
          href="/" 
          icon={<Home className="h-6 w-6" />} 
          label="Home" 
          active={location === "/" || location === ""} 
        />
        <NavItem 
          href="/tasks" 
          icon={<ClipboardList className="h-6 w-6" />} 
          label="Tasks" 
          badge={todaysTasks}
          active={location.startsWith("/tasks")} 
        />
        <Link href="/tasks/new" className="flex flex-col items-center p-3 text-neutral-600">
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center -mt-8 shadow-lg">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs mt-1">Add Task</span>
        </Link>
        <NavItem 
          href="/timesheets" 
          icon={<Clock className="h-6 w-6" />} 
          label="Time" 
          active={location.startsWith("/timesheets")} 
        />
        
        {/* Popup menu for more options that are relevant to technicians */}
        <div className="group relative">
          <NavItem 
            href="#" 
            icon={<FileCog className="h-6 w-6" />} 
            label="Tools" 
            active={
              location.startsWith("/products") || 
              location.startsWith("/photos") || 
              location.startsWith("/service-sheets")
            } 
          />
          
          <div className="invisible group-hover:visible md:group-hover:flex md:group-hover:flex-col absolute bottom-full right-0 mb-2 w-48 md:w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
            <div className="hidden md:block px-4 py-2 border-b border-neutral-100 mb-1">
              <h3 className="font-medium text-neutral-800">Technician Tools</h3>
            </div>
            <Link href="/products" className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
              <Package2 className="h-5 w-5 mr-3 text-neutral-500" />
              <span>Materials & Inventory</span>
            </Link>
            <Link href="/photos" className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
              <Camera className="h-5 w-5 mr-3 text-neutral-500" />
              <span>Photos</span>
            </Link>
            <Link href="/service-sheets" className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
              <FileCog className="h-5 w-5 mr-3 text-neutral-500" />
              <span>Service Sheets</span>
            </Link>
            <Link href="/calendar" className="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50">
              <Calendar className="h-5 w-5 mr-3 text-neutral-500" />
              <span>Calendar</span>
            </Link>
            
            <div className="border-t border-neutral-200 my-1"></div>
            
            <Link href="tel:+18005551234" className="flex items-center px-4 py-3 text-sm text-orange-600 hover:bg-orange-50">
              <Phone className="h-5 w-5 mr-3" />
              <span>Call Tech Support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
