import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct } from '../services/storeService';
import { Plus, Edit2, Trash2, Search, AlertCircle, X, Box, AlertTriangle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', brand: '', stock: 0, basePrice: 0, costPrice: 0
  });

  useEffect(() => {
    // Real-time subscription
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', brand: '', stock: 0, basePrice: 0, costPrice: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update
        const updatedProduct: Product = {
            ...editingProduct,
            name: formData.name || 'Unknown',
            brand: formData.brand || 'Generic',
            stock: Number(formData.stock),
            basePrice: Number(formData.basePrice),
            costPrice: Number(formData.costPrice),
        };
        await updateProduct(updatedProduct);
      } else {
        // Create (ID handled by Firestore)
        const newProduct = {
          name: formData.name || 'Unknown',
          brand: formData.brand || 'Generic',
          stock: Number(formData.stock),
          basePrice: Number(formData.basePrice),
          costPrice: Number(formData.costPrice),
        } as Product; // Cast for now, ID added by DB
        await addProduct(newProduct);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Error saving product. Check console.");
    }
  };

  const promptDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setDeleteId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-[#fffdf5]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div className="w-full sm:w-auto">
            <div className="inline-block bg-black text-white px-3 py-1 font-bold text-sm mb-2 neo-border transform -rotate-2">
                DATABASE
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-black font-display uppercase">Inventory 📦</h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="neo-btn bg-[#FFDE00] text-black px-6 py-3 rounded-none flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={20} strokeWidth={3} /> <span className="font-bold">ADD NEW ITEM</span>
        </button>
      </div>

      <div className="neo-border bg-white p-0 shadow-[4px_4px_0px_0px_#000]">
        <div className="p-4 border-b-2 border-black flex items-center gap-3 bg-gray-50">
            <Search className="text-black shrink-0" size={20} strokeWidth={3} />
            <input 
                type="text" 
                placeholder="SEARCH DATABASE..." 
                className="bg-transparent border-none outline-none text-black w-full placeholder-gray-400 font-bold uppercase font-display text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-black text-white font-display uppercase tracking-wider text-sm">
                <tr>
                <th className="px-6 py-4 border-r-2 border-white">Product Name</th>
                <th className="px-6 py-4 border-r-2 border-white">Brand</th>
                <th className="px-6 py-4 border-r-2 border-white">Stock</th>
                <th className="px-6 py-4 border-r-2 border-white">Cost</th>
                <th className="px-6 py-4 border-r-2 border-white">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center font-bold animate-pulse">Connecting to Database...</td></tr>
                ) : filteredProducts.map((p, idx) => (
                <tr key={p.id} className={`hover:bg-[#E0F2FE] transition-colors border-b-2 border-black ${idx === filteredProducts.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-6 py-5 font-bold text-lg">{p.name}</td>
                    <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-white border-2 border-black font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#000]">{p.brand}</span>
                    </td>
                    <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 border-2 border-black font-bold text-xs shadow-[2px_2px_0px_0px_#000] ${p.stock < 20 ? 'bg-[#FF6B6B] text-white' : 'bg-[#4ECDC4] text-black'}`}>
                        {p.stock < 20 && <AlertCircle size={14} />}
                        {p.stock}
                    </span>
                    </td>
                    <td className="px-6 py-5 font-mono font-bold text-gray-500">฿{p.costPrice.toFixed(2)}</td>
                    <td className="px-6 py-5 font-mono font-black text-xl">฿{p.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenModal(p)} className="p-2 border-2 border-black bg-white hover:bg-[#FFDE00] shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                                <Edit2 size={16} strokeWidth={2.5} />
                            </button>
                            <button onClick={() => promptDelete(p.id)} className="p-2 border-2 border-black bg-white hover:bg-[#FF6B6B] hover:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                                <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {!loading && filteredProducts.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-12 text-center">
                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                <Box size={48} strokeWidth={1} />
                                <p className="font-bold font-display text-xl">NO ITEMS FOUND</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#FFFDF5] border-4 border-black p-6 md:p-8 w-full max-w-lg shadow-[8px_8px_0px_0px_#000] relative my-auto">
            <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                <h3 className="text-2xl md:text-3xl font-black font-display uppercase">{editingProduct ? 'Edit Item ✏️' : 'New Item ✨'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="bg-black text-white p-1 hover:rotate-90 transition-transform">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="font-bold text-xs uppercase tracking-wide bg-[#FFDE00] inline-block px-1 border border-black">Brand</label>
                    <input
                      required
                      type="text"
                      className="neo-input w-full p-3 font-bold text-lg"
                      placeholder="e.g. Marlboro"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="font-bold text-xs uppercase tracking-wide bg-[#FFDE00] inline-block px-1 border border-black">Product Name</label>
                    <input
                      required
                      type="text"
                      className="neo-input w-full p-3 font-bold text-lg"
                      placeholder="e.g. Red Label"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase tracking-wide">Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="neo-input w-full p-3 font-mono font-bold"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
                 <div className="space-y-2">
                  <label className="font-bold text-xs uppercase tracking-wide">Cost (฿)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="neo-input w-full p-3 font-mono font-bold"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  />
                </div>
                 <div className="space-y-2">
                  <label className="font-bold text-xs uppercase tracking-wide">Price (฿)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="neo-input w-full p-3 font-mono font-bold"
                    value={formData.basePrice}
                    onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  />
                </div>
              </div>
             
              <div className="flex gap-4 mt-8 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-bold border-2 border-black uppercase hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 neo-btn bg-[#FF5D01] text-white py-4 text-lg"
                >
                  Save Data 💾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFDF5] border-4 border-black p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000] relative">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-[#FF6B6B] p-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                    <AlertTriangle size={32} className="text-white" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black font-display uppercase mt-2">Delete Item?</h3>
                <p className="font-bold text-gray-600">
                    Are you sure you want to remove this item from the database? This action cannot be undone.
                </p>
                <div className="flex gap-4 w-full mt-6">
                    <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-3 font-bold border-2 border-black uppercase hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 neo-btn bg-[#FF6B6B] text-white py-3"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};