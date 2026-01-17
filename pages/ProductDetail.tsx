import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingCart, ShieldCheck, Zap, Loader2, X, User, FileText, Phone, MapPin, Mail, ArrowRight, AlertCircle, MessageCircle } from 'lucide-react';
import { Product, View, SiteContent, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface ProductDetailProps {
  productId: string | null;
  onNavigate: (view: View) => void;
  content: SiteContent;
  notify?: (type: any, title: string, message: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onNavigate, content, notify }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; type: 'api' | 'cors' | 'config' | null }>({ message: '', type: null });
  
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
    if (!productId) {
      onNavigate('products');
      return;
    }

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();
        
        if (data && !error) {
          setProduct(data);
        } else {
          onNavigate('products');
        }
      } catch (err) {
        console.error('Erro ao carregar material:', err);
        onNavigate('products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, onNavigate]);

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

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!product) return;
    setErrorState({ message: '', type: null });
    setPaying(true);

    try {
      // 1. CAPTURA DE LEAD (Supabase) - Inserção explícita para o Kanban
      // Usamos insert em vez de upsert para garantir a captura mesmo que o email já exista
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Checkout: ${product.title}`,
          message: `Iniciou checkout para o produto: ${product.title}`,
          status: 'Aguardando Pagamento',
          product_id: product.id,
          product_name: product.title,
          value: Number(product.price),
          cpf_cnpj: customerData.cpfCnpj,
          postal_code: customerData.postalCode,
          address: customerData.address,
          address_number: customerData.addressNumber,
          province: customerData.province,
          city: customerData.city,
          complement: customerData.complement,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError) {
        console.error("Erro ao salvar lead no Supabase:", leadError);
        // Se o erro for de coluna, avisamos o admin
        if (leadError.message.includes('column')) {
          throw new Error("Erro de Banco de Dados: Coluna 'whatsapp' ou campos de endereço ausentes. Por favor, execute o SQL de atualização no Supabase.");
        }
      }

      // 2. DISPARAR WEBHOOK (Asaas/n8n)
      if (content.asaas_backend_url && content.asaas_backend_url.startsWith('http')) {
        const isSandbox = !!content.asaas_use_sandbox;
        const apiKey = isSandbox ? content.asaas_sandbox_key : content.asaas_production_key;
        const asaasBaseUrl = isSandbox ? 'https://api-sandbox.asaas.com/' : 'https://api.asaas.com/';
        
        if (!apiKey) {
          throw new Error(`Configuração incompleta: API Key do Asaas para ${isSandbox ? 'Sandbox' : 'Produção'} não encontrada.`);
        }

        const payload = {
          token: apiKey,
          environment: isSandbox ? 'sandbox' : 'production',
          asaas_base_url: asaasBaseUrl,
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
            id: product.id,
            name: product.title,
            value: Number(product.price),
            description: product.description
          },
          type: 'PRODUCT_SALE',
          lead_id: leadData?.id,
          callback: {
            successUrl: `${window.location.origin}/#thank-you`
          }
        };

        const response = await fetch(content.asaas_backend_url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const rawData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          throw new Error(rawData.message || `Erro do servidor Asaas (${response.status})`);
        }

        const checkoutUrl = findUrlInResponse(rawData);
        
        if (checkoutUrl) {
          if (rawData.id && leadData?.id) {
             await supabase.from('leads').update({ payment_id: rawData.id }).eq('id', leadData.id);
          }
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Link de pagamento não retornado pelo servidor.');
        }
      } else {
        // Fallback para Link Direto se não houver automação
        if (product.checkout_url) {
          window.open(product.checkout_url, '_blank');
        } else {
          redirectToWhatsApp();
        }
      }
    } catch (err: any) {
      console.error('Checkout Error:', err);
      setErrorState({ message: err.message, type: 'api' });
      if (notify) notify('error', 'Erro no Checkout', err.message);
    } finally {
      setPaying(false);
    }
  };

  const redirectToWhatsApp = () => {
    if (!product) return;
    const msg = `Olá! Quero o material: *${product.title}*. Nome: ${customerData.name || 'Pendente'}`;
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <Loader2 className="animate-spin text-brand-purple mb-4" size={48} />
      <p className="font-black text-brand-dark uppercase tracking-widest text-xs">Carregando...</p>
    </div>
  );

  if (!product) return null;

  return (
    <div className="bg-brand-cream/30 pb-20 md:pb-32 pt-8 md:pt-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <button 
          onClick={() => onNavigate('products')} 
          className="group flex items-center gap-2 text-brand-purple font-black mb-8 md:mb-12 hover:translate-x-[-8px] transition-all text-sm"
        >
          <ArrowLeft size={18} className="group-hover:scale-125 transition-transform" /> 
          VOLTAR PARA A LOJA
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 lg:gap-24 items-start">
          <div className="space-y-6 md:space-y-8 lg:sticky lg:top-32">
            <div className="relative group">
              <div className="absolute -inset-4 bg-brand-purple/10 rounded-[2.5rem] md:rounded-[4.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img 
                src={product.image_url} 
                className="relative w-full rounded-[2.5rem] md:rounded-[4rem] shadow-3xl border-4 md:border-8 border-white object-cover aspect-square" 
                alt={product.title} 
              />
              <div className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 bg-brand-orange text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-3xl rotate-6 animate-bounce">
                <Zap size={32} className="md:size-[40px]" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="flex flex-col text-center lg:text-left">
            <div className="bg-brand-purple/10 text-brand-purple px-4 py-1.5 md:px-5 md:py-2 rounded-full inline-block w-fit text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6 shadow-sm mx-auto lg:mx-0">
              {product.category}
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-brand-dark mb-6 md:mb-8 tracking-tighter leading-tight lg:leading-[0.9] uppercase">
              {product.title}
            </h1>
            
            <div className="h-1.5 w-16 md:w-24 bg-brand-orange rounded-full mb-8 md:mb-10 mx-auto lg:mx-0"></div>
            
            <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 md:mb-12 leading-relaxed">
              {product.description}
            </p>

            <div className="bg-white p-8 md:p-10 lg:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-3xl border border-brand-lilac/10 relative overflow-hidden">
              <div className="relative z-10">
                <div className="mb-8 md:mb-10">
                  {product.old_price && (
                    <p className="text-lg md:text-xl text-gray-300 line-through mb-1 font-bold">De R$ {Number(product.old_price).toFixed(2)}</p>
                  )}
                  <div className="flex items-baseline justify-center lg:justify-start gap-2">
                    <span className="text-[10px] md:text-sm font-black text-brand-purple uppercase">Apenas</span>
                    <p className="text-5xl md:text-6xl lg:text-7xl font-black text-brand-purple tracking-tighter">
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-6">
                  <button 
                    onClick={() => setShowBillingForm(true)}
                    className="w-full bg-brand-orange text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-xl md:text-2xl lg:text-3xl shadow-2xl hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    <ShoppingCart size={28} className="md:size-[32px]" /> 
                    COMPRAR AGORA
                  </button>
                  <p className="text-gray-400 text-[9px] md:text-[11px] font-bold text-center flex items-center justify-center gap-2 uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-green-500" /> Checkout Seguro via Asaas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] md:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="p-6 md:p-10 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <ShoppingCart className="text-brand-purple" size={24} />
                <h3 className="text-xl md:text-2xl font-black text-brand-dark uppercase tracking-tighter">Faturamento</h3>
              </div>
              <button onClick={() => { setShowBillingForm(false); setErrorState({ message: '', type: null }); }} className="p-2 md:p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={24} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleCheckout} className="p-6 md:p-10 lg:p-12 overflow-y-auto custom-scrollbar flex-grow">
              {errorState.message && (
                <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top">
                  <AlertCircle className="text-red-500 shrink-0" size={24} />
                  <div>
                    <p className="text-red-800 font-black text-xs uppercase tracking-widest mb-1">Erro no Processamento</p>
                    <p className="text-red-600 text-sm font-medium">{errorState.message}</p>
                    <button type="button" onClick={redirectToWhatsApp} className="mt-3 text-red-700 font-black text-[10px] uppercase underline flex items-center gap-2">
                      <MessageCircle size={14} /> Tentar pelo WhatsApp
                    </button>
                  </div>
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
                  disabled={paying}
                  className="w-full bg-brand-purple text-white py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {paying ? (
                    <><Loader2 className="animate-spin" /> PROCESSANDO...</>
                  ) : (
                    <><ShoppingCart size={24}/> IR PARA O PAGAMENTO</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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