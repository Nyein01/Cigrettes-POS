import React from 'react';
import { ShoppingCart, Package, FileText, Cigarette, Archive, ChevronRight, Settings, Gamepad2, Bot } from 'lucide-react';
import { interact } from '../services/interactionService';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const menuItems = [
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'oracle', label: 'The Oracle', icon: Bot },
    { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigate = (id: string) => {
    interact();
    onNavigate(id);
  };

  return (
    <div className="flex flex-col h-full glass-panel lg:rounded-3xl shadow-2xl lg:shadow-xl animate-fade-in border-r lg:border border-white/40">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-4 border-b border-white/30 bg-white/10">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
           <Cigarette size={24} strokeWidth={2.5} />
        </div>
        <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">Khao San</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-3 tracking-widest opacity-80">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl transition-all duration-300 group backdrop-blur-sm ${
                isActive 
                  ? 'bg-white/60 text-indigo-700 shadow-sm translate-x-1 border border-white/50' 
                  : 'text-slate-600 hover:bg-white/40 hover:text-slate-900 hover:translate-x-1 hover:border hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400 group-hover:scale-110 group-hover:text-indigo-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`font-semibold text-sm ${isActive ? 'tracking-wide' : ''}`}>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={16} className="text-indigo-500 animate-pulse" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/30 bg-white/10">
        <div className="bg-emerald-100/40 border border-emerald-200/50 text-emerald-700 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            SYSTEM ONLINE
        </div>
      </div>
    </div>
  );
};