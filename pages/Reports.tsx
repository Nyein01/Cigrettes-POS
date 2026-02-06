import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sale } from '../types';
import { subscribeToSales, getProductsOnce, clearSalesHistory, archiveCurrentSales, deleteSale } from '../services/storeService';
import { Download, DollarSign, Package, Archive, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { interact } from '../services/interactionService';
import { Tooltip } from '../components/Tooltip';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSales(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((q, i) => q + i.quantity, 0), 0);
  // Keep profit for PDF
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);

  const downloadPDF = async () => {
    interact();
    const doc = new jsPDF();
    const products = await getProductsOnce();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Khao San Cigarettes - Report", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const inventoryData = products.map(p => [
        p.name,
        p.stock.toString(),
        `B${p.basePrice.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Name', 'Stock', 'Price']], 
        body: inventoryData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] }
    });

    const lastY = (doc as any).lastAutoTable.finalY || 50;
    
    const salesData = sales.map(s => [
        new Date(s.date).toLocaleDateString(),
        s.items.map(i => `${i.name} (${i.quantity})`).join(', '),
        `B${s.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Date', 'Items', 'Total']],
        body: salesData,
        startY: lastY + 15,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.text(`Total Revenue: B${totalRevenue.toFixed(2)}`, 14, finalY + 10);
    doc.text(`Total Profit: B${totalProfit.toFixed(2)}`, 14, finalY + 16);

    doc.save("khaosan_report.pdf");
  };

  const handleDeleteSale = async () => {
    interact();
    if (saleToDelete) {
        await deleteSale(saleToDelete);
        setSaleToDelete(null);
    }
  };

  const handleClearHistory = async () => {
    interact();
    await clearSalesHistory();
    setShowClearConfirm(false);
  };

  const handleArchive = async () => {
    interact();
    await archiveCurrentSales();
    setShowArchiveConfirm(false);
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-8 gap-4 lg:gap-6">
        <div>
           <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Analytics</h2>
           <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base">Overview of your store performance</p>
        </div>
        
        <div className="flex flex-wrap gap-2 lg:gap-3 w-full lg:w-auto">
            <Tooltip content="Archive today's sales and start fresh for tomorrow" position="bottom">
                <button 
                    onClick={() => { interact(); setShowArchiveConfirm(true); }}
                    className="glass-card bg-white/40 border border-white/50 text-slate-700 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/60 transition-colors shadow-sm text-sm lg:text-base flex-1 lg:flex-none justify-center"
                >
                    <Archive size={18} /> Daily Backup
                </button>
            </Tooltip>
            
            <Tooltip content="Download detailed report with inventory" position="bottom">
                <button 
                    onClick={downloadPDF}
                    className="glass-card bg-white/40 border border-white/50 text-slate-700 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/60 transition-colors shadow-sm text-sm lg:text-base flex-1 lg:flex-none justify-center"
                >
                    <Download size={18} /> PDF
                </button>
            </Tooltip>
            
            <Tooltip content="Permanently delete all current sales records" position="bottom">
                <button 
                    onClick={() => { interact(); setShowClearConfirm(true); }}
                    className="glass-card bg-white/40 border border-white/50 text-rose-600 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm text-sm lg:text-base flex-1 lg:flex-none justify-center"
                >
                    <Trash2 size={18} /> Clear
                </button>
            </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="glass-card rounded-2xl p-5 lg:p-6 flex items-center justify-between group">
            <div>
                <p className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">฿{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-emerald-100/50 p-3 lg:p-4 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <DollarSign size={24} className="lg:w-7 lg:h-7" strokeWidth={2.5} />
            </div>
        </div>
        <div className="glass-card rounded-2xl p-5 lg:p-6 flex items-center justify-between group">
            <div>
                <p className="text-xs lg:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Units Sold</p>
                <p className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{totalItems}</p>
            </div>
            <div className="bg-blue-100/50 p-3 lg:p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform backdrop-blur-sm">
                <Package size={24} className="lg:w-7 lg:h-7" strokeWidth={2.5} />
            </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="glass-panel rounded-xl lg:rounded-2xl overflow-hidden flex flex-col h-auto min-h-[400px] lg:min-h-[500px] animate-fade-in-delay-1 shadow-xl">
            <div className="p-4 lg:p-6 border-b border-white/30 flex justify-between items-center bg-white/20">
                <h3 className="font-bold text-slate-800 text-base lg:text-lg">Recent Sales</h3>
                <span className="text-[10px] lg:text-xs font-bold text-indigo-700 bg-indigo-100/50 backdrop-blur-sm px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border border-indigo-200">{sales.length} Records</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/30 text-slate-600 font-semibold text-xs uppercase sticky top-0 z-10 border-b border-white/30 backdrop-blur-md">
                        <tr>
                            <th className="px-4 py-3 lg:px-6 lg:py-4">Time</th>
                            <th className="px-4 py-3 lg:px-6 lg:py-4 w-1/2">Items</th>
                            <th className="px-4 py-3 lg:px-6 lg:py-4 text-right">Total</th>
                            <th className="px-4 py-3 lg:px-6 lg:py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20">
                        {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading sales data...</td></tr> : sales.slice().reverse().map((sale, i) => (
                            <tr key={sale.id} className="hover:bg-white/30 transition-colors group animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                                <td className="px-4 py-3 lg:px-6 lg:py-4 align-top">
                                    <div className="font-bold text-slate-800 text-xs lg:text-sm">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div className="text-[10px] lg:text-xs text-slate-500 font-medium mt-0.5">{new Date(sale.date).toLocaleDateString()}</div>
                                </td>
                                <td className="px-4 py-3 lg:px-6 lg:py-4 align-top">
                                    <div className="flex flex-col gap-1.5">
                                        {sale.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-slate-700">
                                                <span className="font-medium text-xs lg:text-sm line-clamp-1">{item.name}</span>
                                                <span className="text-[10px] font-bold bg-white/50 text-slate-600 px-1.5 py-0.5 rounded border border-white/40">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 lg:px-6 lg:py-4 text-right align-top">
                                    <div className="font-bold text-slate-900 bg-white/50 inline-block px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg border border-white/40 text-xs lg:text-sm">
                                        ฿{sale.total.toFixed(2)}
                                    </div>
                                </td>
                                <td className="px-4 py-3 lg:px-6 lg:py-4 text-right align-top">
                                    <Tooltip content="Delete this record and restock items" position="left">
                                        <button 
                                            onClick={() => { interact(); setSaleToDelete(sale.id); }}
                                            className="text-slate-400 hover:text-rose-600 transition-all p-1.5 lg:p-2 rounded-lg hover:bg-rose-100/50 lg:hover:scale-110"
                                        >
                                            <Trash2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                                        </button>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && sales.length === 0 && (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-4">
                        <div className="bg-white/40 p-5 rounded-full shadow-inner">
                            <Package size={40} className="text-slate-400" />
                        </div>
                        <span className="font-medium text-lg">No sales recorded yet</span>
                    </div>
                )}
            </div>
      </div>

      {/* Delete Single Sale Confirmation - Rendered via Portal */}
      {saleToDelete && createPortal(
         <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-panel bg-white/90 rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl scale-100">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="bg-rose-100 p-4 rounded-full text-rose-600 shadow-inner">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Delete Transaction?</h3>
                    <p className="text-sm text-slate-500 font-medium">
                        This will remove the sale record and <strong>restore the inventory stock</strong>.
                    </p>
                    <div className="flex gap-3 w-full mt-4">
                        <button onClick={() => { interact(); setSaleToDelete(null); }} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white transition-colors">Cancel</button>
                        <button onClick={handleDeleteSale} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/30">Delete</button>
                    </div>
                </div>
            </div>
         </div>,
         document.body
      )}

      {/* Clear All Confirmation - Rendered via Portal */}
      {showClearConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel bg-white/90 rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-rose-100 p-4 rounded-full text-rose-600 shadow-inner">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Clear All History?</h3>
                <p className="text-sm text-slate-500 font-medium">
                    This will permanently delete all sales records. Use "Daily Backup" if you want to save them.
                </p>
                <div className="flex gap-3 w-full mt-4">
                    <button onClick={() => { interact(); setShowClearConfirm(false); }} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white transition-colors">Cancel</button>
                    <button onClick={handleClearHistory} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/30">Delete All</button>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Archive Confirmation - Rendered via Portal */}
      {showArchiveConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel bg-white/90 rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-amber-100 p-4 rounded-full text-amber-600 shadow-inner">
                    <Archive size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Create Daily Backup?</h3>
                <p className="text-sm text-slate-500 font-medium">
                    Moves current sales to the Archive tab grouped by today's date.<br/>The main dashboard will be cleared for a new day.
                </p>
                <div className="flex gap-3 w-full mt-4">
                    <button onClick={() => { interact(); setShowArchiveConfirm(false); }} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white transition-colors">Cancel</button>
                    <button onClick={handleArchive} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30">Backup</button>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};