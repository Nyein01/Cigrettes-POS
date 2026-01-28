import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { subscribeToArchivedSales, restoreArchivedSales } from '../services/storeService';
import { Archive as ArchiveIcon, RefreshCcw, Search, AlertTriangle } from 'lucide-react';

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
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-[#fffdf5]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div className="w-full sm:w-auto">
            <div className="inline-block bg-[#FF5D01] text-white px-3 py-1 font-bold text-sm mb-2 neo-border transform -rotate-2">
                STORAGE
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-black font-display uppercase">Sales Archive 🗄️</h2>
        </div>
        
        {archivedSales.length > 0 && (
             <button
                onClick={() => setShowRestoreConfirm(true)}
                className="neo-btn bg-[#4ECDC4] text-black px-6 py-3 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                <RefreshCcw size={20} strokeWidth={3} /> <span className="font-bold">RESTORE ALL DATA</span>
            </button>
        )}
       
      </div>

      <div className="neo-border bg-white p-0 shadow-[4px_4px_0px_0px_#000]">
        <div className="p-4 border-b-2 border-black flex items-center gap-3 bg-gray-50">
            <Search className="text-black shrink-0" size={20} strokeWidth={3} />
            <input 
                type="text" 
                placeholder="SEARCH ARCHIVE (Item or Date)..." 
                className="bg-transparent border-none outline-none text-black w-full placeholder-gray-400 font-bold uppercase font-display text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-black text-white font-display uppercase tracking-wider text-sm">
                <tr>
                    <th className="px-6 py-4 border-r-2 border-white">Date Archived</th>
                    <th className="px-6 py-4 border-r-2 border-white">Items</th>
                    <th className="px-6 py-4 border-r-2 border-white">Total</th>
                    <th className="px-6 py-4">Profit</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center font-bold animate-pulse">Loading Archive...</td></tr>
                ) : filteredSales.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                <ArchiveIcon size={48} strokeWidth={1} />
                                <p className="font-bold font-display text-xl">ARCHIVE IS EMPTY</p>
                                <p className="text-sm">Use "Archive Data" in Reports to move items here.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredSales.map((sale, idx) => (
                    <tr key={sale.id} className={`hover:bg-[#E0F2FE] transition-colors border-b-2 border-black ${idx === filteredSales.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-6 py-5">
                             <div className="font-bold">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                             <div className="text-xs text-gray-500 font-bold uppercase">{new Date(sale.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                                {sale.items.map((item, i) => (
                                    <span key={i} className="text-sm font-bold">
                                        {item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span>
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="px-6 py-5 font-mono font-black text-xl">฿{sale.total.toFixed(2)}</td>
                        <td className="px-6 py-5 font-mono font-bold text-green-600">฿{sale.profit.toFixed(2)}</td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

       {/* Restore Confirmation Modal */}
       {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF5] border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000] relative">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[#4ECDC4] p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                    <RefreshCcw size={32} className="text-black" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black font-display uppercase mt-2">Restore All Data?</h3>
                <p className="font-bold text-gray-600">
                    This will move all archived sales BACK to the main dashboard. It will combine with any currently active sales.
                </p>
                <div className="flex gap-4 w-full mt-6">
                    <button
                        onClick={() => setShowRestoreConfirm(false)}
                        className="flex-1 py-3 font-bold border-2 border-black uppercase hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRestore}
                        className="flex-1 neo-btn bg-[#4ECDC4] text-black py-3"
                    >
                        Yes, Restore
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};