
import React, { useState, useEffect } from 'react';
import { Package, Download, ExternalLink, Loader2, Sparkles, Clock, AlertCircle, CheckCircle2, Lock, ArrowRight, RefreshCcw, ShieldCheck, Gem, Youtube, FileText, HardDrive, Link as LinkIcon, ShoppingCart, User, Mail, Phone, MapPin, X } from 'lucide-react';
import { View, Lead, Product, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface MyAccountProps {
  onNavigate: (view: View) => void;
  user: any;
  content?: any; // Recebendo content para configurações de pagamento (opcional, mas recomendado passar via App.tsx se disponível)
}

// Componente de Input para o Modal de Pagamento
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
  
  // Estados para o Checkout Rápido
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);

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
    
    // 1. Buscar Configurações do Site (para chaves de pagamento)
    const { data: config } = await supabase.from('site_content').select('*').eq('id', 1).single();
    if (config) setSiteConfig(config);

    // 2. Buscar TODOS os produtos (Vitrine completa)
    const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (products) setAllProducts(products);

    // 3. Buscar as compras do usuário
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('email', user.email);

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

  // Lógica de Compra Rápida (Cópia da lógica do ProductDetail)
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
      // 1. Criar Lead
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

      // 2. Chamar Gateway (Se configurado)
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
        const asaasData = Array.isArray(rawData) ? rawData[0] : rawData;

        if (asaasData?.url) {
           // Atualiza lead com ID do pagamento
           await supabase.from('leads').update({ payment_id: asaasData.id }).eq('id', leadData.id);
           window.location.href = asaasData.url;
        } else {
           throw new Error('Erro ao gerar link de pagamento.');
        }
      } else {
        // Fallback WhatsApp
        const msg = `Olá! Quero destravar o material: *${selectedProduct.title}* direto pelo portal.`;
        window.open(`https://wa.me/${siteConfig.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }

    } catch (err: any) {
      setCheckoutError(err.message || "Erro ao processar pagamento.");
    } finally {
      setPaying(false);
    }
  };

  const handleDownload = (lead: Lead, product: Product) => {
    if (product.download_url) {
      window.open(product.download_url, '_blank');
    } else {
      alert("Material em processamento. Contate o suporte.");
    }
  };

  const openMaterial = (url: string) => window.open(url, '_blank');

  const getMaterialIcon = (type: string) => {
    switch(type) {
      case 'video': return <Youtube size={16} className="text-red-500" />;
      case 'drive': return <HardDrive size={16} className="text-blue-500" />;
      case 'file': return <FileText size={16} className="text-brand-orange" />;
      default: return <LinkIcon size={16} className="text-brand-purple" />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <div className="relative">
        <Loader2 className="animate-spin text-brand-purple mb-4" size={64} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-brand-orange animate-pulse" size={24} />
        </div>
      </div>
      <p className="font-black text-brand-dark uppercase tracking-widest text-xs mt-4">Carregando Biblioteca...</p>
    </div>
  );

  return (
    <div className="bg-brand-cream/30 min-h-screen pb-32">
      {/* Header */}
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
               {isSyncing && (
                 <span className="flex items-center gap-2 text-[10px] font-black text-brand-orange animate-pulse uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                   <RefreshCcw size={12} className="animate-spin" /> Sincronizando
                 </span>
               )}
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

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {/* GRID ESTILO NETFLIX */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allProducts.map(product => {
            // Verificar status do produto para este usuário
            const userLead = userLeads.find(lead => lead.product_id === product.id && (lead.status !== 'Cancelado' && lead.status !== 'Perdido'));
            const isUnlocked = userLead && (userLead.status === 'Pago' || userLead.status === 'Fechado');
            const isPending = userLead && userLead.status === 'Aguardando Pagamento';
            const isLocked = !userLead; // Não comprou ainda

            const hasMultipleMaterials = product.materials && product.materials.length > 0;

            return (
              <div key={product.id} className={`bg-white rounded-[3rem] shadow-xl overflow-hidden border transition-all relative flex flex-col h-full group ${isLocked ? 'grayscale-[0.8] hover:grayscale-0 border-gray-200' : 'border-brand-lilac/10 hover:shadow-2xl'}`}>
                
                {/* Visual Lock Overlay for Locked Items */}
                {isLocked && (
                  <div className="absolute inset-0 bg-brand-dark/60 z-10 flex flex-col items-center justify-center text-white backdrop-blur-[1px] opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-brand-orange p-4 rounded-full shadow-2xl mb-4">
                      <Lock size={32} />
                    </div>
                    <p className="font-black uppercase tracking-widest text-sm">Conteúdo Bloqueado</p>
                    <p className="text-xs font-medium mt-1 opacity-80">Clique para liberar acesso</p>
                  </div>
                )}

                <div className="p-8 md:p-10 space-y-6 flex-grow flex flex-col relative z-0">
                  <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-2xl transition-colors ${isUnlocked ? 'bg-green-50 text-green-600' : isPending ? 'bg-brand-orange/10 text-brand-orange' : 'bg-gray-100 text-gray-400'}`}>
                      {isUnlocked ? <CheckCircle2 size={32} /> : isPending ? <Clock size={32} /> : <Lock size={32} />}
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      isUnlocked ? 'bg-green-500 text-white border-green-600' : 
                      isPending ? 'bg-brand-orange text-white border-brand-orange' : 
                      'bg-gray-200 text-gray-500 border-gray-300'
                    }`}>
                      {isUnlocked ? 'LIBERADO' : isPending ? 'PROCESSANDO' : 'BLOQUEADO'}
                    </div>
                  </div>

                  <div className="flex-grow">
                    {/* Imagem do Produto Pequena se Bloqueado, ou escondida se quiser */}
                    <h3 className="text-2xl font-black text-brand-dark leading-tight line-clamp-2 min-h-[4rem] group-hover:text-brand-purple transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Package size={12} /> {product.category}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-50 mt-auto">
                    {isUnlocked ? (
                      // CONTEÚDO LIBERADO
                      <div className="space-y-4">
                        {hasMultipleMaterials ? (
                          <>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple mb-2">Materiais Disponíveis</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                              {product.materials?.map((mat, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => openMaterial(mat.url)}
                                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-brand-lilac/10 rounded-xl border border-gray-100 transition-all group/item text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg shadow-sm">{getMaterialIcon(mat.type)}</div>
                                    <span className="text-xs font-bold text-gray-600 group-hover/item:text-brand-purple truncate max-w-[120px]">{mat.title}</span>
                                  </div>
                                  <ExternalLink size={12} className="text-gray-300 group-hover/item:text-brand-purple" />
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleDownload(userLead!, product)}
                            className="w-full bg-brand-purple text-white py-5 rounded-2xl font-black text-sm shadow-lg hover:bg-brand-dark transition-all flex items-center justify-center gap-3 group/btn"
                          >
                            <Download size={18} className="group-hover/btn:translate-y-1 transition-transform" /> 
                            {product.download_url ? 'BAIXAR MATERIAL' : 'AGUARDANDO LINK'}
                          </button>
                        )}
                      </div>
                    ) : isPending ? (
                      // PENDENTE
                      <div className="space-y-3">
                         <p className="text-[11px] font-bold text-gray-500 leading-relaxed text-center">Pagamento em análise. O acesso será liberado automaticamente.</p>
                         <button 
                          onClick={() => window.open(`https://wa.me/5533999872505?text=Pagamento pendente: ${product.title}`, '_blank')}
                          className="w-full border-2 border-brand-orange text-brand-orange py-3 rounded-xl font-black text-[10px] uppercase hover:bg-brand-orange hover:text-white transition-all"
                         >
                           Precisa de ajuda?
                         </button>
                      </div>
                    ) : (
                      // BLOQUEADO (COMPRAR AGORA)
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase">Investimento</span>
                            <span className="text-xl font-black text-brand-dark">R$ {Number(product.price).toFixed(2)}</span>
                         </div>
                         <button 
                          onClick={() => handleUnlockProduct(product)}
                          className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2 group/lock"
                         >
                           <ShoppingCart size={18} /> DESTRANCAR AGORA
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner Clube */}
        <div className="mt-20 p-12 bg-brand-dark rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden shadow-3xl">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mt-32"></div>
           <div className="flex items-center gap-6 text-center md:text-left relative z-10">
              <div className="bg-brand-orange p-4 rounded-full text-white shadow-xl animate-pulse">
                <Gem size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tight">Acesso Ilimitado</h4>
                <p className="text-brand-lilac font-medium">Assine o Clube e libere todos os materiais da vitrine de uma vez.</p>
              </div>
           </div>
           <button onClick={() => onNavigate('products')} className="bg-white text-brand-dark px-10 py-5 rounded-2xl font-black shadow-2xl hover:bg-brand-orange hover:text-white transition-all relative z-10">
              ASSINAR CLUBE PROTAGONISTA
           </button>
        </div>
      </div>

      {/* Modal de Checkout Rápido */}
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
