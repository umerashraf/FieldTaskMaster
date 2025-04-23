import { useState } from "react";
import { useAppContext } from "@/lib/context/AppContext";
import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function MobileHeader() {
  const { user } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      setIsMenuOpen(!isMenuOpen);
      
      if (!isMenuOpen) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('fixed', 'top-0', 'left-0', 'bottom-0', 'z-40');
      } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('fixed', 'top-0', 'left-0', 'bottom-0', 'z-40');
      }
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 md:hidden flex items-center justify-between">
      <div className="flex items-center">
        <button 
          id="mobile-menu-button" 
          className="mr-2 text-neutral-600"
          onClick={toggleMenu}
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-primary-600">FieldServe Pro</h1>
      </div>
      <div className="flex items-center space-x-3">
        <button className="text-neutral-600">
          <Bell className="h-6 w-6" />
        </button>
        <Avatar className="h-8 w-8 bg-primary-600 text-white">
          <AvatarFallback>{user?.initials}</AvatarFallback>
        </Avatar>
      </div>

      {/* Overlay to close the sidebar when clicked outside */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={toggleMenu}
        />
      )}
    </header>
  );
}
