import React, { useState, useEffect } from 'react';
import { Sale } from '../types';
import { subscribeToSales, getProductsOnce } from '../services/storeService';
import { Download, TrendingUp, DollarSign, Package, Calendar, ArrowUpRight } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Reports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSales(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.items.reduce((q, i) => q + i.quantity, 0), 0);

  const chartData = sales.reduce((acc: any[], sale) => {
    const date = sale.date.split('T')[0];
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.amount += sale.total;
    } else {
      acc.push({ date, amount: sale.total });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const downloadPDF = async () => {
    const doc = new jsPDF();
    // We need to fetch products explicitly for the report since we are in reports view
    const products = await getProductsOnce();

    // 1. Title & Timestamp
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Khao San Cigarettes - Status Report", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // 2. Current Inventory Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Current Stock Inventory", 14, 40);

    const inventoryData = products.map(p => [
        p.brand,
        p.name,
        p.stock.toString(),
        `B${p.basePrice.toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [['Brand', 'Name', 'Stock', 'Price']],
        body: inventoryData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] }, // Black header
        styles: { font: 'helvetica', fontSize: 10 }
    });

    // 3. Sales History Table
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

    // 4. Financial Summary
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text(`Total Revenue: B${totalRevenue.toFixed(2)}`, 14, finalY + 15);
    doc.text(`Total Profit: B${totalProfit.toFixed(2)}`, 100, finalY + 15);

    doc.save("khaosan_full_report.pdf");
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-[#fffdf5]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
           <div className="bg-[#4ECDC4] border-2 border-black px-4 py-1 inline-block font-bold transform -rotate-1 mb-2 shadow-[3px_3px_0px_0px_#000]">
                DAILY METRICS
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-black font-display uppercase tracking-tight">Analytics Dashboard 📊</h2>
        </div>
        <div>
            <button 
                onClick={downloadPDF}
                className="neo-btn bg-black text-white px-6 py-3 flex items-center gap-2 hover:bg-gray-800 w-full md:w-auto justify-center"
            >
                <Download size={18} />
                DOWNLOAD FULL REPORT
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
            { label: 'REVENUE', value: `฿${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-[#FFDE00]', text: 'text-black' },
            { label: 'NET PROFIT', value: `฿${totalProfit.toFixed(2)}`, icon: TrendingUp, color: 'bg-[#FF5D01]', text: 'text-white' },
            { label: 'UNITS SOLD', value: totalItems, icon: Package, color: 'bg-[#4ECDC4]', text: 'text-black' },
            { label: 'SALES COUNT', value: sales.length, icon: Calendar, color: 'bg-[#000000]', text: 'text-white' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 neo-box p-6 bg-white relative">
            <div className="absolute top-0 left-0 bg-black text-white px-4 py-1 font-bold text-sm border-r-2 border-b-2 border-white">
                REVENUE TREND
            </div>
            {loading ? (
                <div className="h-80 flex items-center justify-center">Loading Data...</div>
            ) : (
                <div className="h-80 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="0" y2="10" style={{stroke:'black', strokeWidth:1}} />
                                </pattern>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                            <XAxis dataKey="date" stroke="#000" fontSize={12} tickLine={false} axisLine={{strokeWidth: 2}} tick={{fontFamily: 'Space Grotesk', fontWeight: 'bold'}} />
                            <YAxis stroke="#000" fontSize={12} tickLine={false} axisLine={{strokeWidth: 2}} tickFormatter={(value) => `฿${value}`} tick={{fontFamily: 'Space Grotesk', fontWeight: 'bold'}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0px 0px #000', fontFamily: 'Space Grotesk', fontWeight: 'bold' }}
                                itemStyle={{ color: '#000' }}
                                formatter={(value: number) => [`฿${value}`, 'REVENUE']}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#000" strokeWidth={3} fill="url(#diagonalHatch)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>

        {/* Recent Transactions List */}
        <div className="neo-box bg-white flex flex-col h-full">
            <div className="p-4 border-b-2 border-black bg-[#FFDE00] flex justify-between items-center">
                <h3 className="font-black text-black font-display uppercase">Recent Sales</h3>
                <div className="w-3 h-3 bg-red-500 rounded-full border border-black animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y-2 divide-black">
                        {loading ? <tr><td className="p-4">Loading...</td></tr> : sales.slice().reverse().slice(0, 5).map((sale, i) => (
                            <tr key={sale.id} className="hover:bg-gray-50 group">
                                <td className="p-4">
                                    <div className="font-bold">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">{new Date(sale.date).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{sale.items.length} Items</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-black bg-black text-white inline-block px-2 py-0.5 transform group-hover:rotate-2 transition-transform">
                                        ฿{sale.total.toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && sales.length === 0 && (
                    <div className="p-8 text-center text-gray-400 font-bold">NO SALES YET</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};