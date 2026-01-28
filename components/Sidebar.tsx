import React from 'react';
import { ShoppingCart, Package, FileText, Cigarette, ArrowRight, Archive } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const menuItems = [
    { id: 'pos', label: 'Point of Sale', emoji: '🛒', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', emoji: '📦', icon: Package },
    { id: 'reports', label: 'Reports', emoji: '📊', icon: FileText },
    { id: 'archive', label: 'Archive', emoji: '🗄️', icon: Archive },
  ];

  return (
    <div className="flex flex-col gap-4 h-full md:h-[calc(100vh-2rem)]">
      {/* Brand Card */}
      <div className="neo-box p-6 rounded-xl bg-[#FFDE00] flex flex-col items-start gap-2 relative overflow-hidden shrink-0">
        <div className="absolute -right-4 -top-4 opacity-10">
            <Cigarette size={120} />
        </div>
        <div className="border-2 border-black bg-white p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
           <Cigarette size={24} />
        </div>
        <div className="z-10">
            <h1 className="text-2xl font-black tracking-tight text-black font-display uppercase leading-none mt-2">Khao San</h1>
            <p className="text-black font-bold text-sm bg-white inline-block px-1 border border-black mt-1">CIGARETTES 🚬</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 neo-box rounded-xl bg-white p-4 space-y-3 overflow-y-auto">
        <p className="font-bold text-xs uppercase text-gray-500 mb-2 px-2">Menu</p>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-4 py-4 border-2 border-black rounded-lg transition-all duration-200 group font-bold text-sm ${
                isActive 
                  ? 'bg-[#FF5D01] text-white shadow-[4px_4px_0px_0px_#000000] translate-x-[-2px] translate-y-[-2px]' 
                  : 'bg-white text-black hover:bg-[#E0F2FE] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="font-display tracking-wide">{item.label}</span>
              </div>
              {isActive && <ArrowRight size={16} strokeWidth={3} />}
            </button>
          );
        })}
      </nav>

      {/* Footer Card */}
      <div className="neo-box p-4 rounded-xl bg-[#4ECDC4] text-center border-2 border-black shrink-0">
        <p className="text-xs font-bold text-black font-display">
            SYSTEM STATUS: <span className="bg-green-400 px-1 border border-black animate-pulse">ONLINE</span>
        </p>
        <p className="text-[10px] font-bold mt-1">v2.2 KHAO SAN</p>
      </div>
    </div>
  );
};