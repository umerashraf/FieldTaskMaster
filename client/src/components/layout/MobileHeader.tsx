import { useState } from "react";
import { useAppContext } from "@/lib/context/AppContext";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Notifications from "./Notifications";

export default function MobileHeader() {
  const { user } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      setIsMenuOpen(!isMenuOpen);
      
      if (!isMenuOpen) {
        // Show sidebar with animation
        sidebar.classList.remove('hidden', '-translate-x-full');
        sidebar.classList.add('fixed', 'top-0', 'left-0', 'bottom-0', 'z-40', 'transition-transform', 'duration-300', 'ease-in-out', 'transform', 'translate-x-0', 'w-80');
      } else {
        // Hide sidebar with animation
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.remove('translate-x-0');
        
        // After animation completes, hide completely
        setTimeout(() => {
          if (!isMenuOpen) {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('fixed', 'top-0', 'left-0', 'bottom-0', 'z-40', 'transition-transform', 'duration-300', 'ease-in-out', 'transform', '-translate-x-full', 'w-80');
          }
        }, 300);
      }
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 lg:hidden flex items-center justify-between">
      <div className="flex items-center">
        <button 
          id="mobile-menu-button" 
          className="mr-2 text-neutral-600"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-primary-600">FieldServe Pro</h1>
        <div className="ml-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden md:inline-flex">
            Tech
          </Badge>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Notifications />
        <div className="hidden md:flex items-center border-l border-neutral-200 ml-3 pl-3">
          <div className="text-right mr-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-neutral-500">Field Technician</p>
          </div>
          <Avatar className="h-9 w-9 bg-primary-100 text-primary-700">
            <AvatarFallback>{user?.initials}</AvatarFallback>
          </Avatar>
        </div>
        <div className="md:hidden">
          <Avatar className="h-8 w-8 bg-primary-600 text-white">
            <AvatarFallback>{user?.initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Overlay to close the sidebar when clicked outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleMenu}
        />
      )}
    </header>
  );
}
