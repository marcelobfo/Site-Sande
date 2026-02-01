
import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, ArrowUpRight, Loader2, ArrowRight, Star, Sparkles, Filter, LayoutGrid, List, Gem, Phone, AlertCircle, MessageCircle, X, User, Mail, FileText, MapPin, ChevronDown, CheckCircle2, ShieldCheck, Zap, Lock } from 'lucide-react';
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
      // Filtrar apenas produtos com status 'published'
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published') // Filtro adicionado
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
    const CLUB_ID = '9e30a57d-14a0-4386-8a5f-0f8a85f40000'; // UUID válido para o Clube

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
          product_id: CLUB_ID,
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
          // CRÍTICO: Envia o ID do Lead como referência externa para o Asaas devolver no Webhook
          externalReference: createdLeadId, 
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
            complement: customerData.complement,
            externalReference: createdLeadId // Redundância para garantir
          },
          product: { 
            id: CLUB_ID, 
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

        // Tratamento Robusto de Resposta do Asaas/n8n
        const asaasData = Array.isArray(rawData) ? rawData[0] : rawData;
        // Verifica se os dados estão dentro de 'body', 'data' ou na raiz
        const finalData = asaasData?.body || asaasData?.data || asaasData;
        
        const asaasId = finalData?.id || finalData?.payment_link_id;
        // Adicionado 'payment_url' na verificação
        const checkoutUrl = finalData?.url || finalData?.invoiceUrl || finalData?.paymentLink || finalData?.payment_url;

        if (checkoutUrl) {
          if (createdLeadId) {
             await supabase.from('leads').update({ 
               payment_id: asaasId,
               message: `Link Clube gerado: ${checkoutUrl}. ID Gateway: ${asaasId}`
             }).eq('id', createdLeadId);
          }
          window.location.href = checkoutUrl;
        } else {
          console.error("Payload Recebido do Backend:", rawData);
          throw new Error('Link de pagamento não encontrado na resposta do servidor.');
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
      {/* Banner Clube Premium Redesigned */}
      <section className="bg-white pt-8 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-brand-dark rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-3xl relative grid grid-cols-1 lg:grid-cols-2">
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-purple/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-orange/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

            {/* Image Side */}
            <div className="relative h-[300px] lg:h-auto min-h-[400px] order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent z-10 lg:bg-gradient-to-r"></div>
              <img 
                src={content.clubebannerimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Banner-Clube.png"} 
                className="absolute inset-0 w-full h-full object-cover object-center lg:object-right transform hover:scale-105 transition-transform duration-[2s]" 
                alt="Clube" 
              />
              <div className="absolute top-6 left-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Star size={12} className="text-brand-orange" fill="currentColor" /> Recomendado
              </div>
            </div>

            {/* Content Side */}
            <div className="relative z-20 p-8 md:p-12 lg:p-16 flex flex-col justify-center text-white order-1 lg:order-2">
              <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-orange-900/20">
                <Gem size={28} />
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
                Clube Professora <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lilac to-white">Protagonista</span>
              </h2>

              <p className="text-gray-300 font-medium text-sm md:text-base leading-relaxed mb-8 max-w-md">
                A solução definitiva para sua carreira. Acesso ilimitado a todos os materiais, atualizações semanais e suporte exclusivo.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check size={14} className="text-green-400" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Acesso a Todos os Materiais (+300)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check size={14} className="text-green-400" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Novidades Toda Semana</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check size={14} className="text-green-400" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200">Aulas de Edição no Canva</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 line-through">De R$ 697,00</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-brand-orange">R$</span>
                    <span className="text-4xl lg:text-5xl font-black text-white">{Number(content.clubeprice).toFixed(0)}</span>
                    <span className="text-sm font-bold text-gray-400">/ano</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowClubBillingForm(true)} 
                  className="w-full sm:w-auto flex-grow bg-brand-orange text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 group"
                >
                  Assinar Agora <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

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
      <section className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-purple/5 text-brand-purple px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
             <LayoutGrid size={14} /> Loja Oficial
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter leading-none mb-3">
            Materiais Avulsos
          </h2>
          <p className="text-gray-500 font-medium text-sm md:text-base max-w-xl mx-auto">
            Recursos exclusivos para sua sala de aula, prontos para editar e aplicar.
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
            {filteredProducts.map(product => {
              const isPaymentActive = product.payment_active !== false;
              
              return viewMode === 'grid' ? (
                <div key={product.id} className="group bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-lg border border-brand-lilac/5 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
                  <div className="relative aspect-square overflow-hidden p-2">
                    <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative">
                      <img src={product.image_url} className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${!isPaymentActive ? 'grayscale-[0.5]' : ''}`} alt={product.title} />
                      <div className="absolute top-3 left-3 bg-brand-purple/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
                        {product.category}
                      </div>
                      {!isPaymentActive && (
                        <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                           <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
                             <Lock size={14}/> Em Breve
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex-grow flex flex-col">
                    <h3 className="text-lg md:text-xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-3 mt-auto">
                       <p className="text-xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                       {product.old_price && <span className="text-xs text-gray-300 font-bold line-through">R$ {Number(product.old_price).toFixed(2)}</span>}
                    </div>
                    <button className="mt-4 w-full bg-gray-50 text-brand-purple py-4 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">VER DETALHES <ArrowUpRight size={16} /></button>
                  </div>
                </div>
              ) : (
                <div key={product.id} className="group bg-white p-4 md:p-6 rounded-[2rem] shadow-md hover:shadow-xl transition-all border border-brand-lilac/5 flex items-center gap-4 md:gap-6 cursor-pointer" onClick={() => onNavigate('product-detail', product.id)}>
                  <img src={product.image_url} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shrink-0 ${!isPaymentActive ? 'grayscale' : ''}`} alt="" />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm md:text-lg font-black text-brand-dark truncate group-hover:text-brand-purple transition-colors">{product.title}</h3>
                    <div className="flex items-center gap-3">
                       <p className="text-xs font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</p>
                       {!isPaymentActive && <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-md">Em Breve</span>}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-brand-orange group-hover:text-white transition-all">
                     <ArrowRight size={18} />
                  </div>
                </div>
              );
            })}
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
