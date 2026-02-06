import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sale } from '../types';
import { subscribeToArchivedSales, restoreArchivedSales } from '../services/storeService';
import { Archive as ArchiveIcon, RefreshCcw, Search, Folder, ChevronLeft, Calendar, FileText, DollarSign } from 'lucide-react';

export const Archive: React.FC = () => {
  const [archivedSales, setArchivedSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToArchivedSales((data) => {
      setArchivedSales(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Group sales by Date (Display string as key)
  const salesByDate = useMemo(() => {
    const groups: { [key: string]: { dateObj: Date, sales: Sale[], total: number } } = {};
    
    archivedSales.forEach(sale => {
      const dateObj = new Date(sale.date);
      const dateKey = dateObj.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }); 
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
            dateObj: dateObj,
            sales: [],
            total: 0
        };
      }
      groups[dateKey].sales.push(sale);
      groups[dateKey].total += sale.total;
    });

    return groups;
  }, [archivedSales]);

  // Filter groups based on search term (searches date string OR items inside)
  const filteredGroups = useMemo(() => {
    const groups = Object.entries(salesByDate);
    if (!searchTerm) return groups.sort((a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime());

    return groups.filter(([key, data]) => {
        const dateMatch = key.toLowerCase().includes(searchTerm.toLowerCase());
        // Check if any sale in this day contains the search term
        const contentMatch = data.sales.some(s => 
            s.items.some(i => 
                i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                i.brand.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        return dateMatch || contentMatch;
    }).sort((a, b) => b[1].dateObj.getTime() - a[1].dateObj.getTime());
  }, [salesByDate, searchTerm]);

  const handleRestore = async () => {
    try {
        await restoreArchivedSales();
        setShowRestoreConfirm(false);
    } catch(e) {
        alert("Failed to restore sales. Check console.");
    }
  };

  // Get sales for the currently selected folder
  const selectedFolderSales = selectedDateKey ? salesByDate[selectedDateKey]?.sales || [] : [];
  
  // Filter inside the detail view
  const filteredDetailSales = selectedFolderSales.filter(sale => 
    sale.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
        <div>
            <div className="flex items-center gap-2">
                {selectedDateKey && (
                    <button 
                        onClick={() => setSelectedDateKey(null)}
                        className="p-1.5 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-white/40 rounded-full transition-all"
                    >
                        <ChevronLeft size={28} />
                    </button>
                )}
                <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
                    {selectedDateKey ? selectedDateKey : 'Archive Backups'}
                </h2>
            </div>
            <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base ml-1">
                {selectedDateKey ? 'Viewing transactions for this day' : 'Daily backup folders'}
            </p>
        </div>
        
        {archivedSales.length > 0 && !selectedDateKey && (
             <button
                onClick={() => setShowRestoreConfirm(true)}
                className="bg-indigo-600 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 w-full sm:w-auto text-sm lg:text-base"
            >
                <RefreshCcw size={18} strokeWidth={2.5} /> Restore All Data
            </button>
        )}
      </div>

      <div className="glass-panel rounded-xl lg:rounded-2xl overflow-hidden animate-fade-in-delay-1 shadow-xl flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 lg:p-5 border-b border-white/30 flex items-center gap-3 bg-white/20">
            <Search className="text-slate-500" size={20} />
            <input 
                type="text" 
                placeholder={selectedDateKey ? "Search items in this folder..." : "Search backups by date or item name..."}
                className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {loading ? (
             <div className="flex-1 flex items-center justify-center p-10">
                <p className="text-slate-500 font-medium animate-pulse">Loading Archives...</p>
             </div>
        ) : !selectedDateKey ? (
            /* FOLDER GRID VIEW */
            <div className="p-6 bg-white/10 flex-1">
                {filteredGroups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 mt-10">
                         <div className="bg-white/40 p-4 rounded-full">
                            <ArchiveIcon size={40} strokeWidth={1.5} />
                         </div>
                         <span className="font-medium">No backups found</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                        {filteredGroups.map(([dateKey, data], idx) => (
                            <button 
                                key={dateKey}
                                onClick={() => { setSelectedDateKey(dateKey); setSearchTerm(''); }}
                                className="glass-card bg-white/60 p-5 rounded-2xl flex flex-col gap-4 text-left hover:scale-[1.02] hover:bg-white/80 hover:shadow-lg transition-all group animate-fade-in relative overflow-hidden"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Folder size={80} className="text-indigo-600" />
                                </div>

                                <div className="flex items-start justify-between z-10">
                                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600 shadow-sm group-hover:bg-amber-200 transition-colors">
                                        <Folder size={24} />
                                    </div>
                                    <span className="bg-white/50 px-2 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200/50">
                                        {data.sales.length} Files
                                    </span>
                                </div>
                                
                                <div className="z-10">
                                    <h3 className="font-bold text-slate-800 text-lg">{dateKey}</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-1">
                                        <Calendar size={12} /> {data.dateObj.toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="mt-auto pt-3 border-t border-slate-200/50 flex justify-between items-center z-10">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</span>
                                    <span className="font-bold text-indigo-700 font-mono text-lg">฿{data.total.toFixed(2)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            /* DETAIL LIST VIEW */
            <div className="overflow-x-auto flex-1 bg-white/10">
                 <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-white/30 text-slate-600 font-semibold text-xs uppercase border-b border-white/30">
                        <tr>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDetailSales.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-16 text-center text-slate-400 font-medium">
                                    No items match your search in this folder.
                                </td>
                            </tr>
                        ) : (
                            filteredDetailSales.map((sale, idx) => (
                            <tr key={sale.id} className="hover:bg-white/30 transition-colors border-b border-white/20 last:border-0 animate-fade-in" style={{ animationDelay: `${idx * 0.02}s` }}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm lg:text-base">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                            <div className="text-[10px] lg:text-xs text-slate-500 mt-0.5 font-medium">{new Date(sale.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {sale.items.map((item, i) => (
                                            <span key={i} className="text-sm text-slate-700 font-medium flex items-center gap-2">
                                                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                {item.name} <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded border border-slate-200">x{item.quantity}</span>
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-slate-900 font-mono text-base">฿{sale.total.toFixed(2)}</span>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                 </table>
            </div>
        )}
      </div>

       {/* Restore Confirmation Modal - Rendered via Portal */}
       {showRestoreConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel bg-white/90 rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 shadow-inner">
                    <RefreshCcw size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Restore All Data?</h3>
                <p className="text-sm text-slate-500 font-medium">
                    Moves all archived sales back to the main dashboard. <br/>This will dissolve the daily folders into the main list.
                </p>
                <div className="flex gap-3 w-full mt-4">
                    <button
                        onClick={() => setShowRestoreConfirm(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRestore}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30"
                    >
                        Restore
                    </button>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};