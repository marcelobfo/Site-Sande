
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List, Gem, Phone, AlertCircle, MessageCircle } from 'lucide-react';
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
  const [clubError, setClubError] = useState<{ message: string; type: 'api' | 'cors' | null } | null>(null);

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
    setClubError(null);
    if (content.asaasapikey) {
      setPayingClub(true);
      try {
        const baseUrl = content.asaasissandbox 
          ? 'https://sandbox.asaas.com/api/v3' 
          : 'https://api.asaas.com/v3';

        const response = await fetch(`${baseUrl}/checkouts`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': content.asaasapikey
          },
          body: JSON.stringify({
            billingType: "CREDIT_CARD",
            chargeType: "RECURRENT",
            minutesToExpire: 100,
            items: [{
              name: content.clubetitle || "Clube Protagonista",
              description: content.clubedescription || "Acesso anual completo.",
              value: Number(content.clubeprice),
              quantity: 1
            }],
            subscription: { 
              cycle: "YEARLY" 
            },
            callback: { 
              successUrl: `${window.location.origin}/#thank-you`,
              autoRedirect: true
            }
          })
        });

        const data = await response.json();
        if (response.ok && data.url) {
          window.open(data.url, '_blank');
        } else {
          const msg = data.errors?.[0]?.description || 'Erro ao gerar checkout da assinatura.';
          setClubError({ message: msg, type: 'api' });
        }
      } catch (err: any) {
        console.error('Falha crítica no clube:', err);
        if (err.name === 'TypeError' || err.message.includes('fetch')) {
          setClubError({ 
            message: "A conexão com o servidor de pagamentos foi bloqueada por segurança (CORS). Mas não pare agora! Você pode assinar via WhatsApp em segundos.", 
            type: 'cors' 
          });
        } else {
          redirectToWhatsApp();
        }
      } finally {
        setPayingClub(false);
      }
      return;
    }
    redirectToWhatsApp();
  };

  const redirectToWhatsApp = () => {
    const msg = `Olá Professora Sande! Quero assinar o *Clube Protagonista* (R$ ${Number(content.clubeprice).toFixed(2)}/ano) e garantir acesso a todos os materiais. Como posso realizar meu pagamento?`;
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
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
        <div className="max-w-6xl mx-auto bg-white rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
          <div className="md:w-1/2 relative min-h-[400px]">
            <img src={content.clubebannerimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png"} className="absolute inset-0 w-full h-full object-cover" alt="Clube" />
            <div className="absolute top-8 left-8 bg-brand-orange text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Gem size={14} /> Recomendado
            </div>
          </div>
          <div className="md:w-1/2 p-10 lg:p-20 flex flex-col justify-center">
            <h3 className="text-4xl lg:text-5xl font-black text-brand-dark mb-6">{content.clubetitle || "Clube Protagonista"}</h3>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed font-medium">
              Assinando o clube você leva TODOS os nossos produtos atuais e todas as atualizações futuras.
            </p>
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-black text-brand-purple">R$ {content.clubeprice}</span>
              <span className="text-gray-400 font-bold text-xl">/anual</span>
            </div>

            {clubError && (
              <div className="mb-6 p-6 bg-red-50 text-red-600 rounded-[2rem] flex flex-col gap-4 border border-red-100 animate-in slide-in-from-top">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-tight">{clubError.message}</p>
                </div>
                {clubError.type === 'cors' && (
                  <button 
                    onClick={redirectToWhatsApp} 
                    className="w-full bg-green-500 text-white py-4 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                  >
                    <MessageCircle size={18} /> ASSINAR VIA WHATSAPP
                  </button>
                )}
              </div>
            )}

            <button onClick={handleClubCheckout} disabled={payingClub} className="bg-brand-orange text-white px-10 py-6 rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {payingClub ? <Loader2 className="animate-spin" /> : <>LIBERAR ACESSO AGORA <ArrowRight size={20} /></>}
            </button>
          </div>
        </div>
      </section>

      {/* Materials Vitrine */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">Vitrine de Materiais</h2>
            <p className="text-gray-500 font-medium">Recursos pedagógicos exclusivos para sua sala de aula.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-brand-lilac/10">
            <div className="flex border-r border-gray-100 pr-2 gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:text-brand-purple'}`}><LayoutGrid size={20}/></button>
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
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "space-y-6"}>
            {filteredProducts.map(product => (
              viewMode === 'grid' ? (
                <div key={product.id} className="group bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-brand-lilac/10 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                    <div className="absolute top-6 left-6 bg-brand-purple/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-10 flex-grow flex flex-col">
                    <h3 className="text-2xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-purple transition-colors">{product.title}</h3>
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                    </div>
                    <button className="mt-auto w-full bg-gray-50 text-brand-purple py-4 rounded-2xl font-black text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={18} /></button>
                  </div>
                </div>
              ) : (
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
              )
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
