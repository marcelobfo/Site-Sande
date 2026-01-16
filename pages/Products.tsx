
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
      const priorityKeys = ['invoiceUrl', 'url', 'paymentLink', 'paymentUrl', 'checkoutUrl', 'bankInvoiceUrl', 'invoiceUrl'];
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
    setPayingClub(true);
    
    try {
      // 1. Criar Lead no CRM (Supabase)
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Interesse: Clube Protagonista`,
          message: `Iniciou checkout para a Assinatura do Clube`,
          status: 'Aguardando Pagamento',
          product_id: 'CLUBE-ANUAL',
          product_name: content.clubetitle || 'Clube Professora Protagonista',
          value: Number(content.clubeprice),
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError) console.error("Erro ao salvar lead do clube:", leadError);

      if (content.asaas_backend_url && content.asaas_backend_url.startsWith('http')) {
        const apiKey = content.asaas_use_sandbox ? content.asaas_sandbox_key : content.asaas_production_key;

        if (!apiKey) {
          throw new Error("API Key não encontrada.");
        }

        const payload = {
          token: apiKey,
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
          product: {
            id: 'CLUBE-ANUAL',
            name: content.clubetitle || 'Clube Professora Protagonista',
            value: Number(content.clubeprice),
            description: content.clubedescription || 'Assinatura anual de acesso ilimitado a todos os materiais.'
          },
          type: 'SUBSCRIPTION',
          lead_id: leadData?.id,
          callback: {
            successUrl: `${window.location.origin}/#thank-you`
          }
        };

        const response = await fetch(content.asaas_backend_url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const rawData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          throw new Error(rawData.message || `Erro do servidor (${response.status})`);
        }

        const checkoutUrl = findUrlInResponse(rawData);

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Link de pagamento não retornado pelo servidor. Finalize pelo WhatsApp.');
        }
      } else {
        redirectToWhatsApp();
      }
    } catch (err: any) {
      setClubError({ message: err.message, type: 'api' });
    } finally {
      setPayingClub(false);
    }
  };

  const redirectToWhatsApp = () => {
    const msg = `Olá! Quero assinar o *Clube Protagonista*. Nome: ${customerData.name || 'Pendente'}`;
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
    <div className="bg-brand-cream/30 pb-20 md:pb-32">
      {/* Banner Clube */}
      <section className="bg-brand-purple py-12 md:py-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 hidden md:block"></div>
        <div className="max-w-6xl mx-auto bg-white rounded-[2rem] md:rounded-[4rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
          <div className="md:w-1/2 relative min-h-[300px] md:min-h-[400px]">
            <img src={content.clubebannerimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png"} className="absolute inset-0 w-full h-full object-cover" alt="Clube" />
            <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-brand-orange text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <Gem size={14} /> Recomendado
            </div>
          </div>
          <div className="md:w-1/2 p-8 md:p-10 lg:p-20 flex flex-col justify-center text-center md:text-left">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-dark mb-4 md:mb-6 leading-tight">{content.clubetitle || "Clube Protagonista"}</h3>
            <p className="text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed font-medium">
              Assinando o clube você leva TODOS os nossos produtos atuais e atualizações futuras.
            </p>
            <div className="flex items-baseline justify-center md:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
              <span className="text-4xl md:text-5xl font-black text-brand-purple">R$ {content.clubeprice}</span>
              <span className="text-gray-400 font-bold text-lg md:text-xl">/anual</span>
            </div>

            <button 
              onClick={() => setShowClubBillingForm(true)} 
              className="bg-brand-orange text-white px-8 py-5 md:px-10 md:py-6 rounded-2xl md:rounded-[1.5rem] font-black text-lg md:text-xl shadow-2xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
            >
              LIBERAR ACESSO <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Faturamento Clube */}
      {showClubBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] md:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="p-6 md:p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl md:text-2xl font-black text-brand-dark uppercase tracking-tighter">Dados da Assinatura</h3>
              <button onClick={() => setShowClubBillingForm(false)} className="p-2 md:p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={24} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleClubCheckout} className="p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar flex-grow">
              {clubError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-3">
                  <AlertCircle /> {clubError.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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

              <div className="mt-8 md:mt-12">
                <button 
                  type="submit"
                  disabled={payingClub}
                  className="w-full bg-brand-purple text-white py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {payingClub ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={24}/> GERAR PAGAMENTO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vitrine de Materiais */}
      <section className="max-w-7xl mx-auto px-4 mt-12 md:mt-24">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-8 md:mb-16 text-center md:text-left">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter">Vitrine de Materiais</h2>
            <p className="text-gray-500 font-medium text-sm md:text-base">Recursos exclusivos para sua sala de aula.</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 bg-white p-2 rounded-2xl shadow-sm border border-brand-lilac/10 w-full md:w-auto overflow-hidden">
            <div className="hidden sm:flex border-r border-gray-100 pr-2 gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:text-brand-purple'}`}><LayoutGrid size={20}/></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-300 hover:text-brand-purple'}`}><List size={20}/></button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-grow">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-black text-[10px] md:text-sm whitespace-nowrap transition-all ${activeTab === cat ? 'bg-brand-purple text-white' : 'text-gray-400 hover:bg-brand-purple/5 bg-gray-50'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 md:py-32 flex justify-center"><Loader2 className="animate-spin text-brand-purple" size={48} /></div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10" : "space-y-4 md:space-y-6"}>
            {filteredProducts.map(product => (
              viewMode === 'grid' ? (
                <div key={product.id} className="group bg-white rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-xl border border-brand-lilac/10 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                    <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-brand-purple/90 backdrop-blur-md text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-6 md:p-10 flex-grow flex flex-col">
                    <h3 className="text-lg md:text-2xl font-black text-brand-dark mb-3 md:mb-4 leading-tight group-hover:text-brand-purple transition-colors line-clamp-2 h-12 md:h-16">{product.title}</h3>
                    <div className="flex items-baseline gap-2 mb-6 md:mb-8">
                      <span className="text-2xl md:text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                    </div>
                    <button className="mt-auto w-full bg-gray-50 text-brand-purple py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={18} /></button>
                  </div>
                </div>
              ) : (
                <div key={product.id} className="group bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-md hover:shadow-xl transition-all border border-brand-lilac/5 flex items-center gap-4 md:gap-8 cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                  <img src={product.image_url} className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl object-cover shrink-0" alt="" />
                  <div className="flex-grow min-w-0">
                    <div className="bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full text-[8px] font-black uppercase w-fit mb-1">{product.category}</div>
                    <h3 className="text-sm md:text-xl font-black text-brand-dark truncate">{product.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base md:text-2xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                    <button className="hidden sm:flex text-brand-orange font-black text-xs uppercase items-center gap-1 mt-1">Ver <ArrowRight size={14}/></button>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const BillingInput = ({ label, icon, required, ...props }: any) => (
  <div className="w-full">
    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 md:mb-2 block">{label} {required && '*'}</label>
    <div className="relative group">
      {icon && <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-purple transition-colors">{icon}</div>}
      <input 
        required={required}
        {...props}
        className={`w-full ${icon ? 'pl-12 md:pl-14' : 'px-4 md:px-6'} py-4 md:py-5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base text-brand-dark transition-all outline-none shadow-inner`} 
      />
    </div>
  </div>
);
