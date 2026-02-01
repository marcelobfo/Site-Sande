
import React, { useState, useEffect } from 'react';
import { Package, Download, ExternalLink, Loader2, Sparkles, Clock, AlertCircle, CheckCircle2, Lock, ArrowRight, RefreshCcw, ShieldCheck, Gem, Youtube, FileText, HardDrive, Link as LinkIcon, ShoppingCart, User, Mail, Phone, MapPin, X, LayoutGrid, PlusCircle, PlayCircle, MessageSquare } from 'lucide-react';
import { View, Lead, Product, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface MyAccountProps {
  onNavigate: (view: View, id?: string) => void;
  user: any;
  content?: any;
}

const BillingInput = ({ label, icon, required, ...props }: any) => (
  <div className="w-full">
    <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 block">{label} {required && '*'}</label>
    <div className="relative">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</div>}
      <input 
        required={required}
        {...props}
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-xl font-bold text-sm text-brand-dark transition-all outline-none`} 
      />
    </div>
  </div>
);

export const MyAccount: React.FC<MyAccountProps> = ({ onNavigate, user }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasActiveClub, setHasActiveClub] = useState(false);
  
  // Estados para o Checkout Rápido
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);

  const CLUB_ID = '9e30a57d-14a0-4386-8a5f-0f8a85f40000'; // UUID válido para o Clube

  const [customerData, setCustomerData] = useState<AsaasCustomerData>({
    name: '',
    email: user?.email || '',
    cpfCnpj: '',
    phone: '',
    address: '',
    addressNumber: '',
    complement: '',
    postalCode: '',
    province: '',
    city: ''
  });

  const fetchData = async () => {
    if (!user) return;
    setIsSyncing(true);
    
    const { data: config } = await supabase.from('site_content').select('*').eq('id', 1).single();
    if (config) setSiteConfig(config);

    const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (products) setAllProducts(products);

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (leads) setUserLeads(leads);
    
    setLoading(false);
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('my-account-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads', filter: `email=eq.${user.email}` },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Helper para determinar o status do produto com verificação de validade de 1 ano
  const getProductStatus = (productId: string): { status: 'unlocked' | 'pending' | 'locked', lead: Lead | undefined } => {
    // Busca inicial pelo ID exato
    let leadsForProduct = userLeads.filter(l => l.product_id === productId);
    
    // Lógica Estendida para o Clube (Retrocompatibilidade)
    if (productId === CLUB_ID) {
      const legacyLeads = userLeads.filter(l => 
        l.product_id === 'CLUBE-ANUAL' || 
        (l.product_name && l.product_name.toLowerCase().includes('clube')) ||
        (l.product_name && l.product_name.toLowerCase().includes('assinatura'))
      );
      // Mescla leads evitando duplicatas de referência (embora IDs sejam únicos)
      leadsForProduct = [...leadsForProduct, ...legacyLeads];
    }

    // 1. Tenta achar status pago/fechado
    // Ordena por data decrescente para pegar o mais recente
    leadsForProduct.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const paidLead = leadsForProduct.find(l => 
      l.status === 'Pago' || l.status === 'Fechado' || l.status === 'Aprovado'
    );
    
    if (paidLead) {
      // Verificação de Validade de 1 Ano para o Clube
      if (productId === CLUB_ID) {
        const purchaseDate = new Date(paidLead.created_at);
        const oneYearLater = new Date(purchaseDate);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const now = new Date();

        // Dá uma margem de tolerância ou verifica estritamente
        if (now > oneYearLater) {
          return { status: 'locked', lead: paidLead }; // Expirado
        }
      }
      return { status: 'unlocked', lead: paidLead };
    }
    
    // 2. Tenta achar status aguardando
    const pendingLead = leadsForProduct.find(l => l.status === 'Aguardando Pagamento' || l.status === 'Novo');
    if (pendingLead) return { status: 'pending', lead: pendingLead };
    
    // 3. Bloqueado
    return { status: 'locked', lead: undefined };
  };

  // Atualiza estado global de acesso ao clube
  useEffect(() => {
    const { status } = getProductStatus(CLUB_ID);
    setHasActiveClub(status === 'unlocked');
  }, [userLeads]);

  const handleUnlockProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowBilling(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !siteConfig) return;
    setPaying(true);
    setCheckoutError(null);

    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Checkout Rápido: ${selectedProduct.title}`,
          message: `Compra iniciada na Área de Membros.`,
          status: 'Aguardando Pagamento',
          product_id: selectedProduct.id,
          product_name: selectedProduct.title,
          value: Number(selectedProduct.price),
          cpf_cnpj: customerData.cpfCnpj,
          postal_code: customerData.postalCode,
          address: customerData.address,
          address_number: customerData.addressNumber,
          province: customerData.province,
          city: customerData.city,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError) throw new Error(leadError.message);

      if (siteConfig.asaas_backend_url) {
        const isSandbox = !!siteConfig.asaas_use_sandbox;
        const apiKey = isSandbox ? siteConfig.asaas_sandbox_key : siteConfig.asaas_production_key;
        const asaasBaseUrl = isSandbox ? 'https://api-sandbox.asaas.com/' : 'https://api.asaas.com/';

        const response = await fetch(siteConfig.asaas_backend_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
              city: customerData.city
            },
            product: { 
              id: selectedProduct.id, 
              name: selectedProduct.title, 
              value: Number(selectedProduct.price) 
            },
            lead_id: leadData.id
          })
        });

        const rawData = await response.json().catch(() => ({}));
        
        // Tratamento Robusto
        const asaasData = Array.isArray(rawData) ? rawData[0] : rawData;
        const finalData = asaasData?.body || asaasData?.data || asaasData;
        const paymentId = finalData?.id || finalData?.payment_link_id;
        const checkoutUrl = finalData?.url || finalData?.invoiceUrl || finalData?.paymentLink || finalData?.payment_url;

        if (checkoutUrl) {
           await supabase.from('leads').update({ payment_id: paymentId }).eq('id', leadData.id);
           window.location.href = checkoutUrl;
        } else {
           console.error("Payload Recebido:", rawData);
           throw new Error('Link de pagamento não encontrado na resposta.');
        }
      } else {
        const msg = `Olá! Quero destravar o material: *${selectedProduct.title}* direto pelo portal.`;
        window.open(`https://wa.me/${siteConfig.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }

    } catch (err: any) {
      setCheckoutError(err.message || "Erro ao processar pagamento.");
    } finally {
      setPaying(false);
    }
  };

  // Separação dos Produtos usando a lógica de prioridade
  const myProducts = allProducts.filter(p => {
    const { status } = getProductStatus(p.id);
    return status === 'unlocked' || status === 'pending';
  });

  const availableProducts = allProducts.filter(p => {
    const { status } = getProductStatus(p.id);
    return status === 'locked';
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <div className="relative">
        <Loader2 className="animate-spin text-brand-purple mb-4" size={64} />
      </div>
      <p className="font-black text-brand-dark uppercase tracking-widest text-xs mt-4">Carregando Biblioteca...</p>
    </div>
  );

  return (
    <div className="bg-brand-cream/30 min-h-screen pb-32">
      <section className="bg-brand-dark pt-16 pb-32 text-white px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-brand-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lilac">Portal do Protagonismo</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Minha <span className="text-brand-orange">Biblioteca</span></h1>
            <div className="flex items-center gap-4 mt-2">
               <p className="text-gray-400 font-medium">Olá, {user.email.split('@')[0]}.</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4 backdrop-blur-md">
             <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center font-black text-xl text-white shadow-lg">
               {user.email[0].toUpperCase()}
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Conta Ativa</p>
               <p className="font-bold text-sm text-white">{user.email}</p>
             </div>
          </div>
        </div>
      </section>

      {/* Acesso ao Fórum (Se tiver Clube) */}
      {hasActiveClub && (
        <div className="max-w-7xl mx-auto px-4 -mt-16 mb-16 relative z-20">
          <div className="bg-gradient-to-r from-brand-purple to-brand-dark p-1 rounded-[2.5rem] shadow-2xl">
            <div className="bg-white rounded-[2.2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="bg-brand-purple/10 p-4 rounded-2xl text-brand-purple">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Comunidade VIP</h3>
                  <p className="text-gray-500 font-medium">Interaja com outras professoras, participe de enquetes e tire dúvidas.</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('forum')}
                className="bg-brand-purple text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-brand-dark hover:scale-105 transition-all flex items-center gap-2"
              >
                ACESSAR FÓRUM <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 space-y-16">
        
        {/* SEÇÃO 1: MEUS MATERIAIS (COMPRADOS) */}
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-green-500 text-white p-3 rounded-2xl shadow-lg shadow-green-200">
              <Package size={24} />
            </div>
            <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Meus Materiais</h2>
          </div>

          {myProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myProducts.map(product => {
                const { status } = getProductStatus(product.id);
                const isUnlocked = status === 'unlocked';

                return (
                  <div key={product.id} className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-green-100 hover:shadow-2xl transition-all flex flex-col group">
                    <div className="relative h-40 overflow-hidden">
                       <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.title} />
                       <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-brand-dark/10 transition-colors"></div>
                       {isUnlocked ? (
                         <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">Liberado</div>
                       ) : (
                         <div className="absolute top-4 right-4 bg-brand-orange text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">Processando</div>
                       )}
                    </div>

                    <div className="p-8 md:p-10 space-y-6 flex-grow flex flex-col">
                      <div className="flex-grow">
                        <h3 className="text-2xl font-black text-brand-dark leading-tight line-clamp-2 min-h-[3.5rem]">
                          {product.title}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                          {product.category}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-gray-50 mt-auto">
                        {isUnlocked ? (
                           <button onClick={() => onNavigate('player', product.id)} className="w-full bg-brand-purple text-white py-5 rounded-2xl font-black text-sm shadow-lg hover:bg-brand-dark hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                             <PlayCircle size={18} /> ACESSAR AULAS
                           </button>
                        ) : (
                          <div className="text-center">
                             <p className="text-[11px] font-bold text-gray-500 mb-3">Pagamento em análise.</p>
                             <button onClick={() => window.open(`https://wa.me/5533999872505?text=Pagamento pendente: ${product.title}`, '_blank')} className="w-full border-2 border-brand-orange text-brand-orange py-3 rounded-xl font-black text-[10px] uppercase hover:bg-brand-orange hover:text-white transition-all">
                               Precisa de ajuda?
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="bg-white p-12 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
               <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                 <Package size={32} />
               </div>
               <h3 className="text-xl font-black text-gray-400 uppercase">Sua biblioteca está vazia</h3>
               <p className="text-gray-400 font-medium mt-2">Explore a vitrine abaixo para adquirir seus primeiros materiais.</p>
             </div>
          )}
        </div>

        {/* SEÇÃO 2: VITRINE DE OPORTUNIDADES (BLOQUEADOS) */}
        {availableProducts.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8 pt-8 border-t border-brand-lilac/10">
              <div className="bg-brand-purple text-white p-3 rounded-2xl shadow-lg shadow-purple-200">
                <LayoutGrid size={24} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Complete sua Coleção</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Materiais Disponíveis na Loja</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableProducts.map(product => (
                <div key={product.id} className="bg-white rounded-[3rem] shadow-md border border-gray-200 transition-all flex flex-col h-full group grayscale-[0.5] hover:grayscale-0 hover:shadow-2xl hover:border-brand-lilac/30">
                  {/* Lock Overlay */}
                  <div className="relative p-8 md:p-10 space-y-6 flex-grow flex flex-col">
                    <div className="absolute top-6 right-6 z-20">
                      <div className="bg-gray-100 p-2 rounded-full text-gray-400 group-hover:bg-brand-orange group-hover:text-white transition-all shadow-sm">
                        <Lock size={20} />
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-2xl font-black text-brand-dark leading-tight line-clamp-2 min-h-[4rem] group-hover:text-brand-purple transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Package size={12} /> {product.category}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 mt-auto space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400 uppercase">Investimento</span>
                          <span className="text-xl font-black text-brand-dark">R$ {Number(product.price).toFixed(2)}</span>
                       </div>
                       {product.id === CLUB_ID && getProductStatus(CLUB_ID).status === 'locked' && (
                         <div className="text-center text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2">Assinatura Expirada</div>
                       )}
                       <button 
                        onClick={() => handleUnlockProduct(product)}
                        className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 group/lock"
                       >
                         <ShoppingCart size={18} /> {product.id === CLUB_ID ? 'RENOVAR AGORA' : 'DESTRANCAR AGORA'}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      {showBilling && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-base font-black text-brand-dark uppercase tracking-tighter">Destrancar Conteúdo</h3>
                <p className="text-xs text-brand-purple font-bold">{selectedProduct.title}</p>
              </div>
              <button onClick={() => { setShowBilling(false); setCheckoutError(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleCheckout} className="p-6 overflow-y-auto custom-scrollbar flex-grow">
              {checkoutError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-600 text-xs font-medium">{checkoutError}</p>
                </div>
              )}

              <div className="space-y-4">
                <BillingInput label="Nome Completo" icon={<User size={16}/>} name="name" value={customerData.name} onChange={handleInputChange} required />
                <BillingInput label="WhatsApp (DDD + Número)" icon={<Phone size={16}/>} name="phone" value={customerData.phone} onChange={handleInputChange} required />
                <BillingInput label="CPF ou CNPJ" icon={<FileText size={16}/>} name="cpfCnpj" value={customerData.cpfCnpj} onChange={handleInputChange} required />
                <div className="grid grid-cols-2 gap-4">
                   <BillingInput label="CEP" icon={<MapPin size={16}/>} name="postalCode" value={customerData.postalCode} onChange={handleInputChange} required />
                   <BillingInput label="Número" name="addressNumber" value={customerData.addressNumber} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                   <span className="text-sm font-bold text-gray-400">Total a pagar:</span>
                   <span className="text-2xl font-black text-brand-dark">R$ {Number(selectedProduct.price).toFixed(2)}</span>
                </div>
                <button 
                  type="submit"
                  disabled={paying}
                  className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {paying ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20}/> PAGAR E LIBERAR</>}
                </button>
                <p className="text-[9px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> Ambiente Seguro
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
