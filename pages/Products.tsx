import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List, Gem, Phone, AlertCircle, MessageCircle, X, User, Mail, FileText, MapPin, ChevronDown } from 'lucide-react';
import { View, SiteContent, Product, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface ProductsProps {
  onNavigate: (view: View, id?: string) => void;
  content: SiteContent;
}

export const Products: React.FC<ProductsProps> = ({ onNavigate, content }) => {
  const [activeTab, setActiveTab] = useState('Todos');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingClub, setPayingClub] = useState(false);
  const [showClubBillingForm, setShowClubBillingForm] = useState(false);
  const [clubError, setClubError] = useState<{ message: string; type: 'api' | 'cors' | 'config' | null } | null>(null);
  
  const filterRef = useRef<HTMLDivElement>(null);

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

    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .upsert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Clube: Interesse`,
          message: `Iniciou checkout para a Assinatura do Clube`,
          status: 'Aguardando Pagamento',
          product_id: 'CLUBE-ANUAL',
          product_name: content.clubetitle || 'Clube Professora Protagonista',
          value: Number(content.clubeprice),
          cpf_cnpj: customerData.cpfCnpj,
          postal_code: customerData.postalCode,
          address: customerData.address,
          address_number: customerData.addressNumber,
          province: customerData.province,
          city: customerData.city,
          complement: customerData.complement,
          created_at: new Date().toISOString()
        }], { onConflict: 'email' })
        .select()
        .single();

      if (leadError) throw new Error(`Erro ao salvar no CRM: ${leadError.message}`);

      if (content.asaas_backend_url && content.asaas_backend_url.startsWith('http')) {
        const isSandbox = !!content.asaas_use_sandbox;
        const apiKey = isSandbox ? content.asaas_sandbox_key : content.asaas_production_key;
        const asaasBaseUrl = isSandbox ? 'https://api-sandbox.asaas.com/' : 'https://api.asaas.com/';

        if (!apiKey) throw new Error(`API Key de ${isSandbox ? 'Sandbox' : 'Produção'} não configurada.`);

        const payload = {
          token: apiKey,
          environment: isSandbox ? 'sandbox' : 'production',
          asaas_base_url: asaasBaseUrl, // URL explícita para o backend
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
            description: content.clubedescription || 'Assinatura anual de acesso ilimitado.'
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
        if (!response.ok) throw new Error(rawData.message || `Erro ${response.status}`);

        const checkoutUrl = findUrlInResponse(rawData);
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Link não gerado. Tente via WhatsApp.');
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
                <BillingInput label="WhatsApp (DDD + Número)" icon={<Phone size={18}/>} name="phone" value={customerData.phone} onChange={handleInputChange} required />
                <BillingInput label="CPF ou CNPJ (Só números)" icon={<FileText size={18}/>} name="cpfCnpj" value={customerData.cpfCnpj} onChange={handleInputChange} required />
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
      <section className="max-w-7xl mx-auto px-4 mt-16 md:mt-24">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-dark uppercase tracking-tighter leading-none mb-4">
            Vitrine de Materiais
          </h2>
          <p className="text-gray-500 font-medium text-base md:text-lg">
            Recursos exclusivos para sua sala de aula.
          </p>
        </div>
        
        {/* Filtros Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 md:mb-20">
          
          {/* Mobile Selector Dropdown */}
          <div className="w-full md:hidden relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-white px-8 py-5 rounded-[2rem] shadow-xl border border-brand-lilac/10 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-brand-purple rounded-full"></div>
                 <span className="font-black text-sm text-brand-dark uppercase tracking-widest">{activeTab}</span>
              </div>
              <ChevronDown size={20} className={`text-brand-purple transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 right-0 z-50 bg-white rounded-[2rem] shadow-3xl border border-brand-lilac/5 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="py-4">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => { setActiveTab(cat); setIsFilterOpen(false); }}
                      className={`w-full px-8 py-4 text-left flex items-center justify-between font-black text-xs uppercase tracking-widest transition-colors ${
                        activeTab === cat 
                        ? 'bg-brand-purple/5 text-brand-purple' 
                        : 'text-gray-400 hover:text-brand-purple hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                      {activeTab === cat && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Filter Pills */}
          <div className="hidden md:block bg-white px-8 py-5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-lilac/10">
            <div className="flex items-center gap-4">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveTab(cat)} 
                  className={`px-8 py-3.5 rounded-full font-black text-sm whitespace-nowrap transition-all duration-300 ${
                    activeTab === cat 
                    ? 'bg-brand-purple text-white shadow-lg shadow-purple-200 scale-105' 
                    : 'text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 bg-gray-50/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden lg:flex bg-white p-2 rounded-full shadow-sm border border-brand-lilac/10 gap-1">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-full transition-all ${viewMode === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={18}/></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-full transition-all ${viewMode === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}><List size={18}/></button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 md:py-32 flex justify-center"><Loader2 className="animate-spin text-brand-purple" size={48} /></div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12" : "max-w-4xl mx-auto space-y-4 md:space-y-6"}>
            {filteredProducts.map(product => (
              viewMode === 'grid' ? (
                <div key={product.id} className="group bg-white rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-xl border border-brand-lilac/5 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                    <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-brand-purple/90 backdrop-blur-md text-white px-3 py-1 md:px-5 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                      {product.category}
                    </div>
                  </div>
                  <div className="p-8 md:p-12 flex-grow flex flex-col">
                    <h3 className="text-xl md:text-2xl font-black text-brand-dark mb-4 md:mb-6 leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">{product.title}</h3>
                    <div className="flex items-baseline gap-2 mb-8 md:mb-10">
                      <span className="text-2xl md:text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                    </div>
                    <button className="mt-auto w-full bg-gray-50 text-brand-purple py-4 md:py-5 rounded-2xl font-black text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={18} /></button>
                  </div>
                </div>
              ) : (
                <div key={product.id} className="group bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-md hover:shadow-xl transition-all border border-brand-lilac/5 flex items-center gap-6 md:gap-10 cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                  <img src={product.image_url} className="w-20 h-20 md:w-32 md:h-32 rounded-3xl object-cover shrink-0 border border-gray-100" alt="" />
                  <div className="flex-grow min-w-0">
                    <div className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit mb-2">{product.category}</div>
                    <h3 className="text-lg md:text-2xl font-black text-brand-dark truncate group-hover:text-brand-purple transition-colors">{product.title}</h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl md:text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                    <button className="hidden sm:flex text-brand-orange font-black text-xs uppercase items-center gap-1 mt-2 mx-auto md:mx-0 md:ml-auto">Ver Material <ArrowRight size={14}/></button>
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