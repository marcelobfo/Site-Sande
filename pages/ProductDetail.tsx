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

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!product) return;
    setErrorState({ message: '', type: null });
    setPaying(true);

    let createdLeadId: string | null = null;

    try {
      // 1. SALVAR LEAD INICIAL (Captura dados do formulário)
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: customerData.name,
          email: customerData.email,
          whatsapp: customerData.phone,
          subject: `Checkout: ${product.title}`,
          message: `Iniciou checkout. Aguardando retorno do link.`,
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
          complement: customerData.complement || '',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (leadError) throw new Error(`Erro ao salvar no CRM: ${leadError.message}`);
      createdLeadId = leadData.id;

      // 2. CHAMADA AO GATEWAY (Enviando asaas_base_url e dados completos)
      if (content.asaas_backend_url) {
        const isSandbox = !!content.asaas_use_sandbox;
        const apiKey = isSandbox ? content.asaas_sandbox_key : content.asaas_production_key;
        const asaasBaseUrl = isSandbox ? 'https://api-sandbox.asaas.com/' : 'https://api.asaas.com/';
        
        const payload = {
          token: apiKey,
          environment: isSandbox ? 'sandbox' : 'production',
          asaas_base_url: asaasBaseUrl, // Enviando a base da URL conforme solicitado
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
            id: product.id, 
            name: product.title, 
            value: Number(product.price),
            description: product.description 
          },
          lead_id: createdLeadId
        };

        const response = await fetch(content.asaas_backend_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const rawData = await response.json().catch(() => ({}));
        
        // TRATAMENTO DO RETORNO (Captura dados do primeiro item se vier em Array)
        const asaasData = Array.isArray(rawData) ? rawData[0] : rawData;
        const asaasId = asaasData?.id;
        const checkoutUrl = asaasData?.url;

        if (checkoutUrl) {
          // 3. ATUALIZA O LEAD COM O ID E O LINK GERADO
          if (createdLeadId) {
             await supabase.from('leads').update({ 
               payment_id: asaasId,
               message: `Link Gerado: ${checkoutUrl}. ID Gateway: ${asaasId}`
             }).eq('id', createdLeadId);
          }
          // Redireciona o usuário
          window.location.href = checkoutUrl;
        } else {
          throw new Error('O servidor não retornou a URL de pagamento.');
        }
      } else {
        redirectToWhatsApp();
      }
    } catch (err: any) {
      setErrorState({ message: err.message, type: 'api' });
      if (notify) notify('error', 'Falha no Checkout', err.message);
    } finally {
      setPaying(false);
    }
  };

  const redirectToWhatsApp = () => {
    const msg = `Olá! Quero o material: *${product?.title}*.`;
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  if (loading || !product) return null;

  return (
    <div className="bg-brand-cream/30 pb-12 pt-4 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <button 
          onClick={() => onNavigate('products')} 
          className="group flex items-center gap-2 text-brand-purple font-black mb-6 hover:translate-x-[-4px] transition-all text-[11px] uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> VOLTAR PARA A LOJA
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="lg:sticky lg:top-24 max-w-sm mx-auto lg:max-w-none w-full">
            <img 
              src={product.image_url} 
              className="w-full rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-4 border-white aspect-square object-cover" 
              alt={product.title} 
            />
          </div>

          <div className="flex flex-col text-center lg:text-left">
            <div className="bg-brand-purple/10 text-brand-purple px-3 py-1 rounded-full inline-block w-fit text-[9px] font-black uppercase tracking-widest mb-3 mx-auto lg:mx-0">
              {product.category}
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-brand-dark mb-4 tracking-tighter leading-tight uppercase">
              {product.title}
            </h1>
            
            <div className="h-1 w-12 bg-brand-orange rounded-full mb-6 mx-auto lg:mx-0"></div>
            
            <p className="text-sm md:text-base text-gray-500 font-medium mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {product.description}
            </p>

            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] shadow-2xl border border-brand-lilac/10">
              <div className="mb-6">
                {product.old_price && (
                  <p className="text-xs text-gray-300 line-through mb-1 font-bold">De R$ {Number(product.old_price).toFixed(2)}</p>
                )}
                <div className="flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-[9px] font-black text-brand-purple uppercase">Apenas</span>
                  <p className="text-3xl md:text-5xl font-black text-brand-purple tracking-tighter">
                    R$ {Number(product.price).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setShowBillingForm(true)}
                  className="w-full bg-brand-orange text-white py-4 md:py-5 rounded-xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={20} /> COMPRAR AGORA
                </button>
                <p className="text-gray-400 text-[8px] md:text-[9px] font-bold text-center flex items-center justify-center gap-1.5 uppercase tracking-widest">
                  <ShieldCheck size={12} className="text-green-500" /> Checkout Seguro Asaas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
            <div className="p-4 md:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-black text-brand-dark uppercase tracking-tighter">Dados do Pedido</h3>
              <button onClick={() => { setShowBillingForm(false); setErrorState({ message: '', type: null }); }} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleCheckout} className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-grow">
              {errorState.message && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-600 text-xs font-medium">{errorState.message}</p>
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
                  disabled={paying}
                  className="w-full bg-brand-purple text-white py-4 rounded-xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {paying ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={20}/> IR PARA O PAGAMENTO</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-xl font-bold text-sm text-brand-dark transition-all outline-none`} 
      />
    </div>
  </div>
);