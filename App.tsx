import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Archive } from './pages/Archive';
import { Menu, X, Cigarette } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'inventory':
        return <Inventory />;
      case 'pos':
        return <POS />;
      case 'reports':
        return <Reports />;
      case 'archive':
        return <Archive />;
      default:
        return <POS />;
    }
  };

  return (
    <div className="h-[100dvh] w-full flex font-sans overflow-hidden lg:p-4 lg:gap-4 relative">
      
      {/* Mobile Top Bar - Glass Style */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-panel border-b-0 z-30 px-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 -ml-2 text-slate-700 hover:bg-white/40 rounded-xl transition-colors active:scale-95"
            >
               <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/30">
                   <Cigarette size={16} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">Khao San</span>
            </div>
         </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform lg:relative lg:translate-x-0 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col lg:h-full">
            {/* Mobile Close Button inside Sidebar */}
            <div className="lg:hidden p-4 flex justify-end absolute top-0 right-0 z-50">
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-slate-500 hover:text-rose-500 bg-white/50 backdrop-blur-md rounded-full shadow-sm"
                >
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-hidden h-full">
                <Sidebar currentView={currentView} onNavigate={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full h-full">
        <div className="h-full overflow-hidden pt-16 lg:pt-0">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;