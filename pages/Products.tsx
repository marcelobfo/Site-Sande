
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List } from 'lucide-react';
import { View, SiteContent, Product } from '../types';
import { supabase } from '../lib/supabase';

interface ProductsProps {
  onNavigate: (view: View, id?: string) => void;
  content: SiteContent;
}

export const Products: React.FC<ProductsProps> = ({ onNavigate, content }) => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingClub, setPayingClub] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data && !error) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleClubCheckout = async () => {
    if (content.asaasapikey) {
      setPayingClub(true);
      try {
        const baseUrl = content.asaasissandbox 
          ? 'https://api-sandbox.asaas.com/v3' 
          : 'https://api.asaas.com/v3';

        const response = await fetch(`${baseUrl}/checkouts`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': content.asaasapikey
          },
          body: JSON.stringify({
            billingTypes: ["CREDIT_CARD"],
            chargeTypes: ["RECURRENT"],
            minutesToExpire: 100,
            items: [{
              name: content.clubetitle || "Clube Protagonista",
              description: content.clubedescription || "Acesso anual completo",
              value: content.clubeprice,
              quantity: 1
            }],
            subscription: { cycle: "YEARLY" },
            callback: { successUrl: `${window.location.origin}/#thank-you` }
          })
        });

        const data = await response.json();
        if (response.ok && data.url) {
          window.open(data.url, '_blank');
        } else {
          throw new Error('Falha no checkout');
        }
      } catch (err) {
        window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent("Quero assinar o Clube!")}`, '_blank');
      } finally {
        setPayingClub(false);
      }
      return;
    }
    window.open(`https://wa.me/${content.supportwhatsapp}`, '_blank');
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeTab === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeTab);

  return (
    <div className="bg-brand-cream/30 pb-32">
      {/* Clube Section */}
      <section className="bg-brand-purple py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="max-w-6xl mx-auto bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10">
          <div className="md:w-1/2 relative min-h-[400px]">
            <img src={content.clubebannerimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png"} className="absolute inset-0 w-full h-full object-cover" alt="Clube" />
          </div>
          <div className="md:w-1/2 p-10 lg:p-20 flex flex-col justify-center">
            <h3 className="text-4xl lg:text-5xl font-black text-brand-dark mb-6">{content.clubetitle || "Clube Protagonista"}</h3>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">{content.clubedescription}</p>
            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-5xl font-black text-brand-purple">R$ {content.clubeprice}</span>
              <span className="text-gray-400 font-bold text-xl">/anual</span>
            </div>
            <button onClick={handleClubCheckout} disabled={payingClub} className="bg-brand-orange text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3">
              {payingClub ? <Loader2 className="animate-spin" /> : <>ASSINAR AGORA <ArrowRight size={20} /></>}
            </button>
          </div>
        </div>
      </section>

      {/* Materials Vitrine */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">Materiais</h2>
            <p className="text-gray-500 font-medium">Escolha seu próximo recurso pedagógico.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-brand-lilac/10">
            <div className="flex border-r border-gray-100 pr-2 gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-300 hover:text-brand-purple'}`}><LayoutGrid size={20}/></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-300 hover:text-brand-purple'}`}><List size={20}/></button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-2.5 rounded-xl font-black text-xs whitespace-nowrap transition-all ${activeTab === cat ? 'bg-brand-purple text-white' : 'text-gray-400 hover:bg-brand-purple/5'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-brand-purple" size={48} /></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map(product => (
              <div key={product.id} className="group bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-brand-lilac/10 hover:shadow-2xl transition-all cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                <img src={product.image_url} className="w-full aspect-square object-cover" alt={product.title} />
                <div className="p-10">
                  <h3 className="text-2xl font-black text-brand-dark mb-4 leading-tight">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-gray-50 text-brand-purple py-4 rounded-2xl font-black text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="group bg-white p-6 rounded-[2.5rem] shadow-md hover:shadow-xl transition-all border border-brand-lilac/5 flex items-center gap-8 cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                <img src={product.image_url} className="w-24 h-24 rounded-3xl object-cover shrink-0" alt="" />
                <div className="flex-grow">
                  <div className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit mb-2">{product.category}</div>
                  <h3 className="text-xl font-black text-brand-dark">{product.title}</h3>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                  <button className="text-brand-orange font-black text-xs uppercase flex items-center gap-1 mt-1">Ver Material <ArrowRight size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
