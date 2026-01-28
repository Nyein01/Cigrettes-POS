import React, { useState, useEffect } from 'react';
import { Product, CartItem, Sale } from '../types';
import { subscribeToProducts, saveSale } from '../services/storeService';
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, Search } from 'lucide-react';

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        
        // ID is optional in our new Service, handled by DB
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
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-[#fffdf5]">
      {/* Product List */}
      <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="w-full md:w-auto">
                 <div className="inline-block bg-[#FF5D01] text-white px-3 py-1 font-bold text-sm mb-2 border-2 border-black transform rotate-1 shadow-[2px_2px_0px_0px_#000]">
                    STORE FRONT
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-black font-display uppercase tracking-tight">POS 🏪</h2>
            </div>
            
            <div className="relative w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="FIND PRODUCTS..." 
                    className="w-full bg-white border-2 border-black py-3 pl-4 pr-12 text-black outline-none shadow-[4px_4px_0px_0px_#000] focus:shadow-[2px_2px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] transition-all font-bold font-display uppercase"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-black" size={20} strokeWidth={3} />
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 pb-4">
          {filteredProducts.map((product) => (
            <button key={product.id} 
                onClick={() => addToCart(product)}
                className="bg-white border-2 border-black p-5 text-left transition-all duration-150 hover:bg-[#E0F2FE] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] group relative flex flex-col h-40 justify-between"
            >
              
              <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">
                 In Stock: {product.stock}
              </div>

              <div>
                <span className="text-xs font-black text-black bg-[#FFDE00] px-2 py-0.5 border border-black uppercase tracking-wide inline-block mb-2">{product.brand}</span>
                <h3 className="font-bold text-lg md:text-xl text-black leading-tight group-hover:text-[#FF5D01] transition-colors">{product.name}</h3>
              </div>
              
              <div className="flex justify-between items-end border-t-2 border-black pt-2 border-dashed mt-2">
                 <span className="text-xs font-bold text-gray-500">UNIT PRICE</span>
                 <span className="text-2xl font-black text-black font-mono">฿{product.basePrice.toFixed(2)}</span>
              </div>
            </button>
          ))}
          {/* Add spacer for mobile cart visibility */}
          <div className="h-40 lg:hidden"></div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-[420px] bg-white border-t-4 lg:border-t-0 lg:border-l-4 border-black flex flex-col h-[45vh] lg:h-full z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] relative shrink-0">
        {/* Receipt Header */}
        <div className="p-3 md:p-6 border-b-4 border-black bg-[#FFDE00] relative">
            <h3 className="font-black text-lg md:text-2xl flex items-center gap-3 text-black uppercase font-display transform -rotate-1">
                <ShoppingCart className="text-black" size={24} strokeWidth={3} /> Current Order
            </h3>
            {/* Serrated edge visual trick */}
            <div className="absolute bottom-[-8px] left-0 w-full h-4 bg-transparent" style={{ backgroundImage: 'radial-gradient(circle, transparent 50%, #FFDE00 50%)', backgroundSize: '16px 16px', backgroundPosition: '0 -8px' }}></div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=')]">
          {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-300 m-4 bg-white/50">
                <ShoppingCart size={48} className="mb-4 opacity-20 text-black" />
                <p className="text-lg font-bold font-display uppercase text-gray-300">Cart Empty</p>
             </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-2 md:p-3 border-2 border-black shadow-[3px_3px_0px_0px_#000] relative">
                <button onClick={() => removeFromCart(item.id)} className="absolute -top-3 -right-3 bg-[#FF6B6B] text-white border-2 border-black p-1 hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_#000]">
                    <Trash2 size={12} strokeWidth={3} />
                </button>
                
                <div className="flex justify-between items-start mb-2 pr-4">
                  <div>
                    <h4 className="font-black text-base md:text-lg leading-none">{item.name}</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 bg-black text-white inline-block px-1">{item.brand}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 bg-gray-50 p-2 border border-black border-dashed">
                   <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-colors"><Minus size={12} strokeWidth={3} /></button>
                      <span className="text-base font-black w-6 text-center font-mono">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-black hover:bg-black hover:text-white transition-colors"><Plus size={12} strokeWidth={3} /></button>
                   </div>

                   <div className="flex items-center gap-1 font-mono font-bold text-sm md:text-base">
                        <span>฿</span>
                        <input 
                            type="number" 
                            min="0"
                            step="0.1"
                            className="w-16 text-right bg-transparent border-b-2 border-black focus:bg-[#FFDE00] outline-none"
                            value={item.negotiatedPrice}
                            onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                        />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 md:p-6 bg-white border-t-4 border-black relative">
           <div className="flex justify-between items-center mb-1 font-mono text-xs md:text-sm font-bold text-gray-500">
              <span>SUBTOTAL</span>
              <span>{cart.length} ITEMS</span>
           </div>
           <div className="flex justify-between items-end mb-3 border-b-4 border-black border-double pb-2">
              <span className="text-3xl md:text-5xl font-black text-black tracking-tighter font-display">฿{calculateTotal().toFixed(2)}</span>
           </div>
           
           <button 
             onClick={handleCheckout}
             disabled={cart.length === 0 || isProcessing}
             className={`w-full py-3 md:py-4 text-lg md:text-xl font-black uppercase tracking-wide border-2 border-black transition-all duration-150 flex items-center justify-center gap-2 ${
               checkoutComplete 
                ? 'bg-[#4ECDC4] text-black shadow-[4px_4px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]' 
                : cart.length === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400' 
                    : 'bg-[#FF5D01] text-white shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]'
             }`}
           >
             {isProcessing ? 'PROCESSING...' : checkoutComplete ? <><CheckCircle size={24} strokeWidth={3} /> PAID!</> : 'CHARGE & PRINT 🖨️'}
           </button>
        </div>
      </div>
    </div>
  );
};