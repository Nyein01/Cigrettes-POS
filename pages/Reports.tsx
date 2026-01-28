import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { subscribeToSales, getProductsOnce, clearSalesHistory, archiveCurrentSales } from '../services/storeService';
import { Download, DollarSign, Package, ArrowUpRight, Save, Trash2, Archive } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSales(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  // Total profit calculation kept for PDF generation
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((q, i) => q + i.quantity, 0), 0);

  const downloadPDF = async () => {
    const doc = new jsPDF();
    const products = await getProductsOnce();

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Khao San Cigarettes - Status Report", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Current Stock Inventory", 14, 40);

    const inventoryData = products.map(p => [
        p.name,
        p.stock.toString(),
        `B${p.basePrice.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Name', 'Stock', 'Price']], 
        body: inventoryData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] }, 
        styles: { font: 'helvetica', fontSize: 10 }
    });

    const lastY = (doc as any).lastAutoTable.finalY || 50;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Recent Sales History", 14, lastY + 15);

    const salesData = sales.map(s => [
        new Date(s.date).toLocaleDateString(),
        s.items.map(i => `${i.name} (${i.quantity})`).join(', '),
        `B${s.total.toFixed(2)}`,
        `B${s.profit.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Date', 'Items', 'Total', 'Profit']],
        body: salesData,
        startY: lastY + 20,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { font: 'helvetica', fontSize: 10 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text(`Total Revenue: B${totalRevenue.toFixed(2)}`, 14, finalY + 15);
    doc.text(`Total Profit: B${totalProfit.toFixed(2)}`, 100, finalY + 15);

    doc.save("khaosan_full_report.pdf");
  };

  const downloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sales, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `sales_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleClearHistory = async () => {
    try {
        await clearSalesHistory();
        setShowClearConfirm(false);
    } catch (e) {
        alert("Failed to clear history. Check console.");
    }
  };

  const handleArchive = async () => {
    try {
        await archiveCurrentSales();
        setShowArchiveConfirm(false);
    } catch(e) {
        alert("Failed to archive sales. Check console.");
    }
  }

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-[#fffdf5]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-4">
        <div>
           <div className="bg-[#4ECDC4] border-2 border-black px-4 py-1 inline-block font-bold transform -rotate-1 mb-2 shadow-[3px_3px_0px_0px_#000]">
                DAILY METRICS
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-black font-display uppercase tracking-tight">Analytics Dashboard 📊</h2>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button 
                onClick={() => setShowArchiveConfirm(true)}
                className="neo-btn bg-[#FFDE00] text-black px-4 py-3 flex items-center gap-2 hover:bg-[#ffe54f] flex-1 lg:flex-none justify-center"
            >
                <Archive size={18} strokeWidth={2.5} />
                ARCHIVE DATA
            </button>
            <button 
                onClick={downloadPDF}
                className="neo-btn bg-black text-white px-4 py-3 flex items-center gap-2 hover:bg-gray-800 flex-1 lg:flex-none justify-center"
            >
                <Download size={18} />
                PDF REPORT
            </button>
            <button 
                onClick={() => setShowClearConfirm(true)}
                className="neo-btn bg-[#FF6B6B] text-white px-4 py-3 flex items-center gap-2 hover:bg-red-500 flex-1 lg:flex-none justify-center"
            >
                <Trash2 size={18} />
                CLEAR
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {[
            { label: 'REVENUE', value: `฿${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-[#FFDE00]', text: 'text-black' },
            { label: 'UNITS SOLD', value: totalItems, icon: Package, color: 'bg-[#4ECDC4]', text: 'text-black' },
        ].map((stat, idx) => (
            <div key={idx} className={`neo-box p-6 ${stat.color} ${stat.text} relative overflow-hidden group`}>
                <div className="absolute top-2 right-2 opacity-20 transform group-hover:scale-125 transition-transform duration-300">
                    <stat.icon size={64} />
                </div>
                <p className="font-bold text-xs uppercase tracking-widest mb-2 border-b-2 border-current inline-block pb-1">{stat.label}</p>
                <p className="text-3xl font-black font-mono tracking-tighter">{stat.value}</p>
                <ArrowUpRight className="absolute bottom-4 right-4" size={24} strokeWidth={3} />
            </div>
        ))}
      </div>

      {/* Sales List Container - Expanded to full width */}
      <div className="neo-box bg-white flex flex-col h-auto min-h-[500px]">
            <div className="p-4 border-b-2 border-black bg-[#FFDE00] flex justify-between items-center">
                <h3 className="font-black text-black font-display uppercase">Recent Sales</h3>
                <div className="w-3 h-3 bg-red-500 rounded-full border border-black animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black text-white font-bold text-xs uppercase sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-1/4">Time</th>
                            <th className="p-3 w-1/2">Items Sold</th>
                            <th className="p-3 w-1/4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                        {loading ? <tr><td colSpan={3} className="p-4 text-center font-bold">Loading...</td></tr> : sales.slice().reverse().map((sale, i) => (
                            <tr key={sale.id} className="hover:bg-gray-50 group border-b border-gray-100 last:border-0">
                                <td className="p-3 align-top">
                                    <div className="font-bold text-base">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">{new Date(sale.date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-3 align-top">
                                    <div className="flex flex-col gap-1">
                                        {sale.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-800 border-b border-dashed border-gray-200 pb-1 last:border-0 last:pb-0">
                                                <span>{item.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 text-xs">x{item.quantity}</span>
                                                    {/* Optional: Show individual price if needed */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-3 text-right align-top">
                                    <div className="font-black bg-black text-white inline-block px-3 py-1 text-sm shadow-[2px_2px_0px_0px_#ccc]">
                                        ฿{sale.total.toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && sales.length === 0 && (
                    <div className="p-12 text-center text-gray-400 font-bold flex flex-col items-center gap-2">
                        <Package size={48} strokeWidth={1} />
                        <span>NO SALES RECORDED YET</span>
                    </div>
                )}
            </div>
      </div>

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF5] border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000] relative">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[#FF6B6B] p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                    <Trash2 size={32} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black font-display uppercase mt-2">Delete Permanently?</h3>
                <p className="font-bold text-gray-600">
                    This will delete ALL sales records. <br/>Use "Archive Data" instead if you want to save them for later.
                </p>
                <div className="flex gap-4 w-full mt-6">
                    <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-3 font-bold border-2 border-black uppercase hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClearHistory}
                        className="flex-1 neo-btn bg-[#FF6B6B] text-white py-3"
                    >
                        Delete All
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF5] border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000] relative">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[#FFDE00] p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                    <Archive size={32} className="text-black" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black font-display uppercase mt-2">Archive Data?</h3>
                <p className="font-bold text-gray-600">
                    This will move all current sales to the Archive. The main dashboard will be cleared for new sales. You can restore data later from the Archive tab.
                </p>
                <div className="flex gap-4 w-full mt-6">
                    <button
                        onClick={() => setShowArchiveConfirm(false)}
                        className="flex-1 py-3 font-bold border-2 border-black uppercase hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleArchive}
                        className="flex-1 neo-btn bg-[#FFDE00] text-black py-3"
                    >
                        Yes, Archive
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};