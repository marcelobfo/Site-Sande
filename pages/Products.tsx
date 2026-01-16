
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List, Gem, Phone, AlertCircle, MessageCircle, X, User, Mail, FileText, MapPin } from 'lucide-react';
import { View, SiteContent, Product, AsaasCustomerData } from '../types';
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
  const [showClubBillingForm, setShowClubBillingForm] = useState(false);
  const [clubError, setClubError] = useState<{ message: string; type: 'api' | 'cors' | 'config' | null } | null>(null);

  const [customerData, setCustomerData] = useState<AsaasCustomerData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    address: '',
    addressNumber: '',
    complement: '',
    postalCode: '',
    province: '',
    city: ''
  });

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

  const findUrlInResponse = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string') {
      const isAsaasUrl = obj.startsWith('http') && (obj.includes('asaas.com') || obj.includes('checkout') || obj.includes('pay'));
      return isAsaasUrl ? obj : null;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = findUrlInResponse(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof obj === 'object') {
      const priorityKeys = ['invoiceUrl', 'url', 'paymentLink', 'paymentUrl', 'checkoutUrl', 'bankInvoiceUrl'];
      for (const key of priorityKeys) {
        if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
          return obj[key];
        }
      }
      for (const key in obj) {
        const found = findUrlInResponse(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  const handleClubCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setClubError(null);
    
    if (content.asaas_backend_url && content.asaas_backend_url.startsWith('http')) {
      const apiKey = content.asaas_use_sandbox ? content.asaas_sandbox_key : content.asaas_production_key;

      if (!apiKey) {
        setClubError({ message: "Configuração incompleta: API Key do Asaas não encontrada no painel.", type: 'config' });
        return;
      }

      setPayingClub(true);
      try {
        const response = await fetch(content.asaas_backend_url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: apiKey,
            type: 'SUBSCRIPTION',
            environment: content.asaas_use_sandbox ? 'sandbox' : 'production',
            customer: {
              name: customerData.name,
              email: customerData.email,
              cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
              mobilePhone: customerData.phone.replace(/\D/g, ''),
              postalCode: customerData.postalCode.replace(/\D/g, ''),
              address: customerData.address,
              addressNumber: customerData.addressNumber,
              province: customerData.province,
              complement: customerData.complement,
              city: customerData.city
            },
            subscription: {
              billingType: "CREDIT_CARD",
              value: Number(content.clubeprice),
              cycle: "YEARLY",
              description: content.clubedescription || "Assinatura Clube Protagonista"
            },
            callback: { 
              successUrl: `${window.location.origin}/#thank-you`,
              autoRedirect: true
            }
          })
        });

        const rawData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          throw new Error(rawData.message || `Erro do servidor (${response.status})`);
        }

        const checkoutUrl = findUrlInResponse(rawData);

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          if (rawData.message === "Workflow was started") {
            throw new Error('O n8n respondeu que o fluxo começou, mas não esperou o link do Asaas. Mude o Webhook para "Respond: When last node finishes".');
          }
          throw new Error('Link de pagamento não encontrado na resposta. Por favor, finalize pelo WhatsApp.');
        }
      } catch (err: any) {
        setClubError({ message: err.message, type: 'api' });
      } finally {
        setPayingClub(false);
      }
      return;
    }
    
    redirectToWhatsApp();
  };

  const redirectToWhatsApp = () => {
    const msg = `Olá Professora Sande! Gostaria de assinar o *Clube Protagonista* (R$ ${Number(content.clubeprice).toFixed(2)}/ano) e ter acesso a todos os materiais. Nome: ${customerData.name || 'Pendente'}`;
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeTab === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeTab);

  return (
    <div className="bg-brand-cream/30 pb-32">
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

            <button 
              onClick={() => setShowClubBillingForm(true)} 
              className="bg-brand-orange text-white px-10 py-6 rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
            >
              LIBERAR ACESSO AGORA <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE FATURAMENTO DO CLUBE */}
      {showClubBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Dados da Assinatura</h3>
              <button onClick={() => setShowClubBillingForm(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={24} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleClubCheckout} className="p-10 lg:p-12 overflow-y-auto custom-scrollbar flex-grow">
              {clubError && (
                <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-3xl animate-in slide-in-from-top">
                  <div className="flex items-start gap-4 text-red-600 font-bold mb-4">
                    <AlertCircle size={24} className="shrink-0" />
                    <span className="text-sm leading-tight">{clubError.message}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={redirectToWhatsApp}
                    className="w-full bg-green-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl"
                  >
                    <MessageCircle size={24} /> FINALIZAR NO WHATSAPP
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <BillingInput label="Nome Completo" icon={<User size={18}/>} name="name" value={customerData.name} onChange={handleInputChange} required />
                </div>
                <BillingInput label="E-mail" icon={<Mail size={18}/>} name="email" type="email" value={customerData.email} onChange={handleInputChange} required />
                <BillingInput label="CPF ou CNPJ (Só números)" icon={<FileText size={18}/>} name="cpfCnpj" value={customerData.cpfCnpj} onChange={handleInputChange} required />
                <BillingInput label="WhatsApp (DDD + Número)" icon={<Phone size={18}/>} name="phone" value={customerData.phone} onChange={handleInputChange} required />
                <BillingInput label="CEP (Só números)" icon={<MapPin size={18}/>} name="postalCode" value={customerData.postalCode} onChange={handleInputChange} required />
                <div className="col-span-1 md:col-span-2">
                  <BillingInput label="Endereço" icon={<MapPin size={18}/>} name="address" value={customerData.address} onChange={handleInputChange} required />
                </div>
                <BillingInput label="Número" name="addressNumber" value={customerData.addressNumber} onChange={handleInputChange} required />
                <BillingInput label="Bairro" name="province" value={customerData.province} onChange={handleInputChange} required />
                <BillingInput label="Cidade" name="city" value={customerData.city} onChange={handleInputChange} required />
                <BillingInput label="Complemento" name="complement" value={customerData.complement} onChange={handleInputChange} />
              </div>

              <div className="mt-12 flex flex-col lg:flex-row gap-4">
                <button 
                  type="submit"
                  disabled={payingClub}
                  className="flex-grow bg-brand-purple text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {payingClub ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={24}/> GERAR PAGAMENTO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition-all ${activeTab === cat ? 'bg-brand-purple text-white' : 'text-gray-400 hover:bg-brand-purple/5'}`}>{cat}</button>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const BillingInput = ({ label, icon, required, ...props }: any) => (
  <div className="w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">{label} {required && '*'}</label>
    <div className="relative group">
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors">{icon}</div>}
      <input 
        required={required}
        {...props}
        className={`w-full ${icon ? 'pl-14' : 'px-6'} py-5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-2xl font-bold text-brand-dark transition-all outline-none shadow-inner`} 
      />
    </div>
  </div>
);
