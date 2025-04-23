import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Clock, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link href={href} className="flex flex-col items-center p-3 text-neutral-600">
      <div className={cn(active && "text-primary-600")}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default function MobileNavigation() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
      <div className="flex justify-around">
        <NavItem 
          href="/" 
          icon={<Home className="h-6 w-6" />} 
          label="Dashboard" 
          active={location === "/" || location === ""} 
        />
        <NavItem 
          href="/tasks" 
          icon={<ClipboardList className="h-6 w-6" />} 
          label="Tasks" 
          active={location.startsWith("/tasks")} 
        />
        <Link href="/tasks/new" className="flex flex-col items-center p-3 text-neutral-600">
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center -mt-8 shadow-lg">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs mt-1">New</span>
        </Link>
        <NavItem 
          href="/timesheets" 
          icon={<Clock className="h-6 w-6" />} 
          label="Time" 
          active={location.startsWith("/timesheets")} 
        />
        <NavItem 
          href="/products" 
          icon={<MoreHorizontal className="h-6 w-6" />} 
          label="More" 
          active={location.startsWith("/products")} 
        />
      </div>
    </div>
  );
}
