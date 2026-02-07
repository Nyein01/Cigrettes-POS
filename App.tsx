import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Archive } from './pages/Archive';
import { Settings } from './pages/Settings';
import { Arcade } from './pages/Arcade';
import { Menu, X, Cigarette } from 'lucide-react';
import { checkAndArchiveOldSales } from './services/storeService';

const THEME_MAP: Record<string, string> = {
  daylight: 'bg-mesh-light',
  midnight: 'bg-mesh',
  sunset: 'bg-gradient-to-br from-orange-100 via-rose-100 to-indigo-100',
  ocean: 'bg-gradient-to-br from-cyan-100 via-blue-100 to-indigo-200',
  minimal: 'bg-slate-100',
  custom: 'bg-slate-900' // Fallback for custom if image fails
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Theme State
  // Default to 'daylight' if not set
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'daylight');
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('app-custom-bg') || '');

  useEffect(() => {
    // Check for previous days' sales and archive them automatically on app launch
    checkAndArchiveOldSales();
  }, []);

  // Persist Theme Selection
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // Persist Custom Image
  useEffect(() => {
    if (customBg) {
        try {
            localStorage.setItem('app-custom-bg', customBg);
        } catch (e) {
            console.error("Failed to save custom background to storage. It might be too large.", e);
            // Optional: alert user or handle gracefully
        }
    }
  }, [customBg]);

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
      case 'arcade':
        return <Arcade />;
      case 'settings':
        return <Settings 
          currentTheme={theme} 
          onThemeChange={setTheme} 
          customBg={customBg}
          onCustomBgChange={setCustomBg}
        />;
      default:
        return <POS />;
    }
  };

  // Resolve background logic
  const isCustom = theme === 'custom';
  const themeClass = THEME_MAP[theme] || THEME_MAP['daylight'];
  
  const backgroundStyle: React.CSSProperties = isCustom && customBg 
    ? { 
        backgroundImage: `url(${customBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } 
    : {};

  return (
    <>
      {/* Dynamic Background */}
      <div 
        className={`fixed inset-0 z-[-1] transition-all duration-700 ease-in-out ${themeClass}`}
        style={backgroundStyle}
      >
        {/* Overlay for custom images to ensure text readability */}
        {isCustom && <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />}
      </div>

      <div className="h-[100dvh] w-full flex font-sans overflow-hidden lg:p-4 lg:gap-4 relative z-0">
        
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
    </>
  );
};

export default App;