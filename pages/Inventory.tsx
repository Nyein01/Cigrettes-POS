import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct } from '../services/storeService';
import { Plus, Edit2, Trash2, Search, X, Box, AlertCircle, Save } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', stock: 0, basePrice: 0
  });

  useEffect(() => {
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
      setFormData({ name: '', stock: 0, basePrice: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const updatedProduct: Product = {
            ...editingProduct,
            name: formData.name || 'Unknown',
            brand: editingProduct.brand || 'General', 
            stock: Number(formData.stock),
            basePrice: Number(formData.basePrice),
            costPrice: editingProduct.costPrice || 0,
        };
        await updateProduct(updatedProduct);
      } else {
        const newProduct = {
          name: formData.name || 'Unknown',
          brand: 'General',
          stock: Number(formData.stock),
          basePrice: Number(formData.basePrice),
          costPrice: 0,
        } as Product;
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
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50 lg:rounded-2xl animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4">
        <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Inventory</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm lg:text-base">Manage your product database</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-hover-effect bg-indigo-600 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 w-full sm:w-auto text-sm lg:text-base"
        >
          <Plus size={20} strokeWidth={2.5} /> Add New Item
        </button>
      </div>

      <div className="bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-delay-1">
        <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <Search className="text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search inventory..." 
                className="bg-transparent border-none outline-none text-slate-900 w-full placeholder-slate-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium animate-pulse">Loading Inventory...</td></tr>
                ) : filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-100 last:border-0 group animate-fade-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                    <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${p.stock < 10 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {p.stock < 10 && <AlertCircle size={14} />}
                            {p.stock} Units
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-600">฿{p.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all lg:hover:scale-110">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => promptDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all lg:hover:scale-110">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))}
                {!loading && filteredProducts.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-16 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-3">
                                <div className="bg-slate-100 p-4 rounded-full">
                                    <Box size={40} strokeWidth={1.5} />
                                </div>
                                <span className="font-medium">No items found in inventory</span>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-md shadow-2xl scale-100 transition-transform">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">{editingProduct ? 'Edit Item' : 'New Product'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Product Name</label>
                <input
                    required
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    placeholder="e.g. Marlboro Red Label"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Price (฿)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                    value={formData.basePrice}
                    onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                  />
                </div>
              </div>
             
              <div className="flex gap-3 mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 lg:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-rose-100 p-4 rounded-full text-rose-600 shadow-inner">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delete Item?</h3>
                <p className="text-sm text-slate-500 font-medium">
                    Are you sure you want to remove this item? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full mt-4">
                    <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                    >
                        Delete
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};