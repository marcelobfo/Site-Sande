import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List, Gem, Phone, AlertCircle, MessageCircle, X, User, Mail, FileText, MapPin, ChevronDown } from 'lucide-react';
import { View, SiteContent, Product, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface ProductsProps {
  onNavigate: (view: View, id?: string) => void;
  content: SiteContent;
  notify?: (type: any, title: string, message: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ onNavigate, content, notify }) => {
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

  const handleClubCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setClubError(null);
    setPayingClub(true);
    
    let createdLeadId: string | null = null;

    try {
      // 1. SALVAR LEAD
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Checkout Clube`,
          message: `Iniciou assinatura anual do Clube.`,
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
          complement: customerData.complement || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError) throw new Error(`Falha ao registrar lead: ${leadError.message}`);
      createdLeadId = leadData.id;

      if (content.asaas_backend_url) {
        const isSandbox = !!content.asaas_use_sandbox;
        const apiKey = isSandbox ? content.asaas_sandbox_key : content.asaas_production_key;
        const asaasBaseUrl = isSandbox ? 'https://api-sandbox.asaas.com/' : 'https://api.asaas.com/';

        const payload = {
          token: apiKey,
          environment: isSandbox ? 'sandbox' : 'production',
          asaas_base_url: asaasBaseUrl,
          customer: { 
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
            mobilePhone: customerData.phone.replace(/\D/g, ''),
            address: customerData.address,
            addressNumber: customerData.addressNumber,
            postalCode: customerData.postalCode.replace(/\D/g, ''),
            province: customerData.province,
            city: customerData.city,
            complement: customerData.complement
          },
          product: { 
            id: 'CLUBE-ANUAL', 
            name: content.clubetitle || 'Clube', 
            value: Number(content.clubeprice) 
          },
          type: 'SUBSCRIPTION',
          lead_id: createdLeadId
        };

        const response = await fetch(content.asaas_backend_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const rawData = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(rawData.message || `Erro ${response.status}`);

        const asaasData = Array.isArray(rawData) ? rawData[0] : rawData;
        const asaasId = asaasData?.id;
        const checkoutUrl = asaasData?.url;

        if (checkoutUrl) {
          if (createdLeadId) {
             await supabase.from('leads').update({ 
               payment_id: asaasId,
               message: `Link Clube gerado: ${checkoutUrl}. ID Gateway: ${asaasId}`
             }).eq('id', createdLeadId);
          }
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Link de pagamento não gerado pelo servidor.');
        }
      } else {
        redirectToWhatsApp();
      }
    } catch (err: any) {
      setClubError({ message: err.message, type: 'api' });
      if (notify) notify('error', 'Erro no Clube', err.message);
    } finally {
      setPayingClub(false);
    }
  };

  const redirectToWhatsApp = () => {
    const msg = `Olá! Quero assinar o *Clube Protagonista*. Já iniciei o cadastro no site.`;
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
    <div className="bg-brand-cream/30 pb-16 md:pb-24">
      {/* Banner Clube */}
      <section className="bg-brand-purple py-8 md:py-16 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/20">
          <div className="md:w-1/2 relative min-h-[250px]">
            <img src={content.clubebannerimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png"} className="absolute inset-0 w-full h-full object-cover" alt="Clube" />
          </div>
          <div className="md:w-1/2 p-6 md:p-10 lg:p-16 flex flex-col justify-center text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-brand-dark mb-4 leading-tight">{content.clubetitle || "Clube Protagonista"}</h3>
            <p className="text-gray-500 text-sm md:text-base mb-6 leading-relaxed font-medium">
              Assinando o clube você leva TODOS os nossos produtos atuais e atualizações futuras.
            </p>
            <div className="flex items-baseline justify-center md:justify-start gap-3 mb-6">
              <span className="text-3xl md:text-4xl font-black text-brand-purple">R$ {content.clubeprice}</span>
              <span className="text-gray-400 font-bold text-sm">/anual</span>
            </div>

            <button 
              onClick={() => setShowClubBillingForm(true)} 
              className="bg-brand-orange text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
            >
              LIBERAR ACESSO <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Faturamento Clube */}
      {showClubBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="p-5 md:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter">Dados da Assinatura</h3>
              <button onClick={() => setShowClubBillingForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleClubCheckout} className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-grow">
              {clubError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {clubError.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <BillingInput label="Nome Completo" icon={<User size={16}/>} name="name" value={customerData.name} onChange={handleInputChange} required />
                </div>
                <BillingInput label="E-mail" icon={<Mail size={16}/>} name="email" type="email" value={customerData.email} onChange={handleInputChange} required />
                <BillingInput label="WhatsApp (DDD + Número)" icon={<Phone size={16}/>} name="phone" value={customerData.phone} onChange={handleInputChange} required />
                <BillingInput label="CPF ou CNPJ (Só números)" icon={<FileText size={16}/>} name="cpfCnpj" value={customerData.cpfCnpj} onChange={handleInputChange} required />
                <BillingInput label="CEP (Só números)" icon={<MapPin size={16}/>} name="postalCode" value={customerData.postalCode} onChange={handleInputChange} required />
                <div className="col-span-1 md:col-span-2">
                  <BillingInput label="Endereço" icon={<MapPin size={16}/>} name="address" value={customerData.address} onChange={handleInputChange} required />
                </div>
                <BillingInput label="Número" name="addressNumber" value={customerData.addressNumber} onChange={handleInputChange} required />
                <BillingInput label="Bairro" name="province" value={customerData.province} onChange={handleInputChange} required />
                <BillingInput label="Cidade" name="city" value={customerData.city} onChange={handleInputChange} required />
                <BillingInput label="Complemento" name="complement" value={customerData.complement} onChange={handleInputChange} />
              </div>

              <div className="mt-8">
                <button 
                  type="submit"
                  disabled={payingClub}
                  className="w-full bg-brand-purple text-white py-4 rounded-xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {payingClub ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20}/> GERAR PAGAMENTO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vitrine de Materiais */}
      <section className="max-w-7xl mx-auto px-4 mt-12 md:mt-20">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter leading-none mb-3">
            Vitrine de Materiais
          </h2>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Recursos exclusivos para sua sala de aula.
          </p>
        </div>
        
        {/* Filtros Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10">
          {/* Mobile Selector Dropdown */}
          <div className="w-full md:hidden relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-white px-6 py-4 rounded-2xl shadow-xl border border-brand-lilac/10 flex items-center justify-between"
            >
              <span className="font-black text-xs text-brand-dark uppercase tracking-widest">{activeTab}</span>
              <ChevronDown size={18} className={`text-brand-purple transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-[calc(100%+10px)] left-0 right-0 z-50 bg-white rounded-2xl shadow-3xl border border-brand-lilac/5 overflow-hidden">
                <div className="py-2">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => { setActiveTab(cat); setIsFilterOpen(false); }}
                      className={`w-full px-6 py-3 text-left font-black text-[10px] uppercase tracking-widest ${activeTab === cat ? 'bg-brand-purple/5 text-brand-purple' : 'text-gray-400'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Filter Pills */}
          <div className="hidden md:block bg-white px-6 py-4 rounded-full shadow-sm border border-brand-lilac/10">
            <div className="flex items-center gap-3">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveTab(cat)} 
                  className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === cat ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-brand-purple'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-purple" size={48} /></div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10" : "max-w-4xl mx-auto space-y-4"}>
            {filteredProducts.map(product => (
              viewMode === 'grid' ? (
                <div key={product.id} className="group bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg border border-brand-lilac/5 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                  </div>
                  <div className="p-6 md:p-8 flex-grow flex flex-col">
                    <h3 className="text-lg md:text-xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">{product.title}</h3>
                    <p className="text-xl font-black text-brand-purple mb-6">R$ {Number(product.price).toFixed(2)}</p>
                    <button className="mt-auto w-full bg-gray-50 text-brand-purple py-4 rounded-xl font-black text-xs uppercase group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={16} /></button>
                  </div>
                </div>
              ) : (
                <div key={product.id} className="group bg-white p-4 md:p-6 rounded-[1.5rem] shadow-md hover:shadow-xl transition-all border border-brand-lilac/5 flex items-center gap-4 md:gap-6 cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                  <img src={product.image_url} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shrink-0" alt="" />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm md:text-lg font-black text-brand-dark truncate group-hover:text-brand-purple transition-colors">{product.title}</h3>
                    <p className="text-xs font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                  </div>
                  <ArrowRight className="text-gray-200 group-hover:text-brand-orange transition-colors" />
                </div>
              )
            ))}
          </div>
        )}
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const BillingInput = ({ label, icon, required, ...props }: any) => (
  <div className="w-full">
    <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">{label} {required && '*'}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</div>}
      <input 
        required={required}
        {...props}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-xl font-bold text-sm text-brand-dark transition-all outline-none`} 
      />
    </div>
  </div>
);