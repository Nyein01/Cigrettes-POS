import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Menu, X } from 'lucide-react';

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
      default:
        return <POS />;
    }
  };

  return (
    <div className="h-[100dvh] w-full flex font-sans overflow-hidden p-0 md:p-4 gap-4 bg-[#FDFBF7]">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden absolute top-4 left-4 z-30 p-2 bg-black text-white rounded-md neo-shadow hover:scale-105 transition-transform"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-4 lg:p-0 bg-[#FDFBF7] lg:bg-transparent shadow-2xl lg:shadow-none border-r-2 lg:border-r-0 border-black lg:border-none">
            {/* Mobile Close Button inside Sidebar */}
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden self-end mb-2 p-1 text-black bg-white border-2 border-black rounded hover:bg-red-500 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>
            <Sidebar currentView={currentView} onNavigate={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 neo-box rounded-none md:rounded-xl overflow-hidden bg-white relative w-full h-full mt-0 shadow-none md:shadow-[4px_4px_0px_0px_#000]">
        <div className="h-full overflow-hidden pt-16 lg:pt-0">
            {renderView()}
        </div>
        {/* Decorative elements - hidden on mobile to save space */}
        <div className="hidden md:block absolute top-4 right-4 w-4 h-4 bg-[#FF5D01] border-2 border-black rounded-full pointer-events-none"></div>
        <div className="hidden md:block absolute top-4 right-10 w-4 h-4 bg-[#FFDE00] border-2 border-black rounded-full pointer-events-none"></div>
        <div className="hidden md:block absolute top-4 right-16 w-4 h-4 bg-[#4ECDC4] border-2 border-black rounded-full pointer-events-none"></div>
      </main>
    </div>
  );
};

export default App;