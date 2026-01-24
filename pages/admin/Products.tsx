
import React, { useState } from 'react';
import { LayoutGrid, List, Trash2, Edit3, EyeOff } from 'lucide-react';
import { Product } from '../../types';

interface AdminProductsProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, onEdit, onDelete }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 bg-white p-2 rounded-2xl border border-gray-100 w-fit ml-auto">
        <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={20}/></button>
        <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><List size={20}/></button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border group hover:border-brand-purple transition-all flex flex-col ${product.status === 'draft' ? 'border-dashed border-gray-300 opacity-80' : 'border-gray-100'}`}>
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-50">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-brand-purple/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{product.category}</div>
                {product.status === 'draft' && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                     <span className="bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"><EyeOff size={14}/> Rascunho</span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-black text-brand-dark leading-tight mb-2 group-hover:text-brand-purple transition-colors">{product.title}</h4>
                <p className="text-lg font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                <button onClick={() => onEdit(product)} className="flex-grow py-3 bg-brand-purple/5 text-brand-purple rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all">Editar</button>
                <button onClick={() => onDelete(product.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 bg-white p-6 rounded-[2.5rem] border border-gray-100">
          {products.map(product => (
            <div key={product.id} className={`flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-all border group ${product.status === 'draft' ? 'border-dashed border-gray-300 bg-gray-50/50' : 'border-transparent hover:border-gray-100'}`}>
              <img src={product.image_url} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
              <div className="flex-grow">
                <h4 className="font-black text-brand-dark group-hover:text-brand-purple transition-colors flex items-center gap-2">
                  {product.title}
                  {product.status === 'draft' && <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md font-bold uppercase">Rascunho</span>}
                </h4>
                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="text-brand-purple">{product.category}</span>
                  <span>R$ {Number(product.price).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => onEdit(product)} className="p-3 text-brand-purple hover:bg-brand-purple/10 rounded-xl transition-all"><Edit3 size={18}/></button>
                 <button onClick={() => onDelete(product.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
