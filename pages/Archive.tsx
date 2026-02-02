import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { subscribeToArchivedSales, restoreArchivedSales } from '../services/storeService';
import { Archive as ArchiveIcon, RefreshCcw, Search } from 'lucide-react';

export const Archive: React.FC = () => {
  const [archivedSales, setArchivedSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToArchivedSales((data) => {
      setArchivedSales(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRestore = async () => {
    try {
        await restoreArchivedSales();
        setShowRestoreConfirm(false);
    } catch(e) {
        alert("Failed to restore sales. Check console.");
    }
  };

  const filteredSales = archivedSales.filter(sale => 
    sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    new Date(sale.date).toLocaleDateString().includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 lg:rounded-2xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
        <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Archive</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm lg:text-base">View and restore historical data</p>
        </div>
        
        {archivedSales.length > 0 && (
             <button
                onClick={() => setShowRestoreConfirm(true)}
                className="btn-hover-effect bg-indigo-600 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full sm:w-auto text-sm lg:text-base"
            >
                <RefreshCcw size={18} strokeWidth={2.5} /> Restore All Data
            </button>
        )}
       
      </div>

      <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-delay-1">
        <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Search className="text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search archive..." 
                className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4">Date Archived</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={3} className="p-10 text-center text-slate-400 font-medium animate-pulse">Loading Archive...</td></tr>
                ) : filteredSales.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="p-16 text-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <ArchiveIcon size={40} strokeWidth={1.5} />
                                <span className="font-medium">Archive is empty</span>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredSales.map((sale, idx) => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 animate-fade-in" style={{ animationDelay: `${idx * 0.02}s` }}>
                        <td className="px-6 py-4">
                             <div className="font-bold text-slate-800 text-sm lg:text-base">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                             <div className="text-[10px] lg:text-xs text-slate-400 mt-0.5 font-medium">{new Date(sale.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                                {sale.items.map((item, i) => (
                                    <span key={i} className="text-sm text-slate-700 font-medium">
                                        {item.name} <span className="text-slate-400 text-xs font-normal">x{item.quantity}</span>
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">฿{sale.total.toFixed(2)}</td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

       {/* Restore Confirmation Modal */}
       {showRestoreConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 shadow-inner">
                    <RefreshCcw size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Restore All Data?</h3>
                <p className="text-sm text-slate-500 font-medium">
                    Moves all archived sales back to the main dashboard and combines with active sales.
                </p>
                <div className="flex gap-3 w-full mt-4">
                    <button
                        onClick={() => setShowRestoreConfirm(false)}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRestore}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Restore
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};