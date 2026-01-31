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
    <div className="h-[100dvh] w-full flex font-sans overflow-hidden bg-slate-50 lg:p-4 lg:gap-4">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
               <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-1 rounded shadow-sm">
                   <Cigarette size={16} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800 text-lg tracking-tight">Khao San</span>
            </div>
         </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform lg:relative lg:translate-x-0 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col bg-white lg:bg-transparent lg:h-full">
            {/* Mobile Close Button inside Sidebar */}
            <div className="lg:hidden p-4 border-b border-slate-100 flex justify-end">
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
                >
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-hidden p-4 lg:p-0">
                <Sidebar currentView={currentView} onNavigate={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
            </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-slate-50 md:bg-white/50 md:backdrop-blur-sm lg:bg-transparent rounded-none lg:rounded-2xl relative w-full h-full shadow-none">
        <div className="h-full overflow-hidden pt-16 lg:pt-0">
            {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;