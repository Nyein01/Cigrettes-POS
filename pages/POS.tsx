import React, { useState, useEffect } from 'react';
import { Product, CartItem, Sale } from '../types';
import { subscribeToProducts, saveSale } from '../services/storeService';
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, Search, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Mobile cart expansion state could be added here if we want a collapsible cart, 
  // but for now we'll stick to a fixed ratio that works well.

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => 
    p.stock > 0 &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, negotiatedPrice: product.basePrice }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const maxStock = products.find(p => p.id === id)?.stock || 0;
        return { ...item, quantity: Math.max(1, Math.min(newQty, maxStock)) };
      }
      return item;
    }));
  };

  const updatePrice = (id: string, newPrice: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, negotiatedPrice: newPrice } : item));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.negotiatedPrice * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
        const total = calculateTotal();
        const profit = cart.reduce((sum, item) => sum + ((item.negotiatedPrice - item.costPrice) * item.quantity), 0);
        
        const sale: Sale = {
        id: '', 
        date: new Date().toISOString(),
        items: [...cart],
        total,
        profit
        };

        await saveSale(sale);
        setCart([]);
        setCheckoutComplete(true);
        setTimeout(() => setCheckoutComplete(false), 3000);
    } catch (error) {
        alert("Transaction failed. Please check internet connection.");
        console.error(error);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 lg:bg-slate-50/50 lg:rounded-2xl animate-fade-in">
      {/* Product List Section */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 lg:p-6 bg-white lg:bg-white/80 lg:backdrop-blur-sm border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 z-10 shadow-sm lg:shadow-none">
            <div className="flex justify-between w-full sm:w-auto items-center">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        Store Front <Sparkles size={18} className="text-amber-400" />
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-500 font-medium">Select items to add to cart</p>
                </div>
            </div>
            
            <div className="relative w-full sm:w-72 group">
                <input 
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner group-hover:bg-white group-hover:shadow-md text-sm lg:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" size={18} />
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth bg-slate-50 lg:bg-transparent pb-32 lg:pb-0"> 
            {/* Added bottom padding on mobile to account for overlay or just visual space before cart */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
            {filteredProducts.map((product, idx) => (
                <button key={product.id} 
                    onClick={() => addToCart(product)}
                    className="card-hover-effect bg-white border border-slate-100 rounded-xl lg:rounded-2xl p-3 lg:p-5 text-left flex flex-col h-full justify-between relative overflow-hidden group animate-fade-in shadow-sm hover:shadow-md"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    
                    <div className="flex justify-between items-start mb-2 lg:mb-3">
                         {product.brand && product.brand !== 'General' ? (
                             <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide border border-indigo-100 truncate max-w-[70%]">
                                {product.brand}
                             </span>
                         ) : <span></span>}
                         <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 whitespace-nowrap">
                            {product.stock}
                        </span>
                    </div>

                    <h3 className="font-bold text-slate-800 leading-snug mb-3 text-sm lg:text-lg group-hover:text-indigo-600 transition-colors line-clamp-2">{product.name}</h3>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-auto">
                        <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">Price</span>
                        <span className="text-base lg:text-xl font-bold text-slate-900 font-mono tracking-tight group-hover:scale-110 transition-transform origin-right">฿{product.basePrice.toFixed(2)}</span>
                    </div>
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {/* Mobile: Fixed at bottom or takes up 40% height. Desktop: Sidebar */}
      <div className="w-full lg:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[40vh] lg:h-full z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] lg:shadow-none shrink-0 rounded-t-3xl lg:rounded-none animate-fade-in-delay-1 relative">
        
        {/* Cart Header */}
        <div className="p-4 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10 rounded-t-3xl lg:rounded-none">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-1.5 lg:p-2 rounded-lg text-indigo-600">
                    <ShoppingCart size={18} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-slate-800 text-base lg:text-lg">Current Order</h3>
            </div>
            {cart.length > 0 && (
                <button 
                    onClick={clearCart} 
                    className="text-[10px] lg:text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                    <Trash2 size={12} strokeWidth={2.5} /> CLEAR
                </button>
            )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-2 lg:space-y-3 bg-slate-50/30">
          {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6 gap-3">
                <div className="bg-slate-100 p-4 lg:p-6 rounded-full shadow-inner">
                    <ShoppingCart size={32} className="text-slate-300" />
                </div>
                <p className="text-xs lg:text-sm font-semibold text-slate-500">Cart is empty</p>
             </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 p-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white p-1 rounded-md transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                <div className="flex justify-between items-start mb-2 pr-6">
                    <h4 className="font-bold text-slate-800 text-xs lg:text-sm leading-tight line-clamp-1">{item.name}</h4>
                </div>
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center bg-slate-100 rounded-lg p-0.5 lg:p-1 shadow-inner">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-indigo-600 active:scale-90 transition-all"><Minus size={12} strokeWidth={3} /></button>
                      <span className="w-8 lg:w-10 text-center text-xs lg:text-sm font-bold text-slate-700">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-indigo-600 active:scale-90 transition-all"><Plus size={12} strokeWidth={3} /></button>
                   </div>

                   <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 focus-within:border-indigo-400">
                        <span className="text-slate-400 text-[10px] font-bold">฿</span>
                        <input 
                            type="number" 
                            min="0"
                            step="0.1"
                            className="w-16 text-right text-sm lg:text-base font-bold text-slate-900 bg-transparent outline-none"
                            value={item.negotiatedPrice}
                            onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                        />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="p-4 lg:p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
           <div className="flex justify-between items-center mb-2 lg:mb-3 text-xs lg:text-sm font-medium text-slate-500">
              <span>Items Count</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{cart.reduce((a, c) => a + c.quantity, 0)}</span>
           </div>
           <div className="flex justify-between items-center mb-4 lg:mb-6">
              <span className="text-slate-800 font-bold text-base lg:text-lg">Total Amount</span>
              <span className="text-2xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tighter">฿{calculateTotal().toFixed(2)}</span>
           </div>
           
           <button 
             onClick={handleCheckout}
             disabled={cart.length === 0 || isProcessing}
             className={`w-full py-3 lg:py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98] ${
               checkoutComplete 
                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                : cart.length === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-indigo-300 hover:-translate-y-1'
             }`}
           >
             {isProcessing ? (
                <span className="animate-pulse">Processing...</span>
             ) : checkoutComplete ? (
                <><CheckCircle size={20} className="animate-bounce" /> Paid Successfully</>
             ) : (
                'Charge & Print'
             )}
           </button>
        </div>
      </div>
    </div>
  );
};