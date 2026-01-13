
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingCart, ShieldCheck, Zap, Loader2, X, User, FileText, Phone, MapPin, Mail, ArrowRight, AlertCircle, MessageCircle } from 'lucide-react';
import { Product, View, SiteContent, AsaasCustomerData } from '../types';
import { supabase } from '../lib/supabase';

interface ProductDetailProps {
  productId: string | null;
  onNavigate: (view: View) => void;
  content: SiteContent;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onNavigate, content }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; type: 'api' | 'cors' | 'network' | null }>({ message: '', type: null });
  
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

  const handleCheckout = async (e?: React.FormEvent, skipPreFill = false) => {
    if (e) e.preventDefault();
    if (!product) return;
    setErrorState({ message: '', type: null });

    // Se a API Key do Asaas estiver presente, tentamos o checkout dinâmico.
    if (content.asaasapikey) {
      setPaying(true);
      try {
        const baseUrl = content.asaasissandbox 
          ? 'https://sandbox.asaas.com/api/v3' 
          : 'https://api.asaas.com/v3';

        // Estrutura de Payload baseada na sugestão do usuário e compatibilidade v3
        const payload: any = {
          billingType: "CREDIT_CARD", // Aceita CREDIT_CARD, BOLETO, PIX ou UNDEFINED
          chargeType: "DETACHED",
          minutesToExpire: 120,
          items: [
            {
              name: product.title,
              description: `Material Digital: ${product.title}`,
              value: Number(product.price),
              quantity: 1
            }
          ],
          callback: {
            successUrl: `${window.location.origin}/#thank-you`,
            autoRedirect: true
          }
        };

        // Adiciona dados do cliente se preenchidos
        if (!skipPreFill && customerData.name && customerData.email) {
          payload.customerData = {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
            phone: customerData.phone.replace(/\D/g, ''),
            address: customerData.address,
            addressNumber: customerData.addressNumber,
            complement: customerData.complement,
            postalCode: customerData.postalCode.replace(/\D/g, ''),
            province: customerData.province,
            city: customerData.city
          };
        }

        const response = await fetch(`${baseUrl}/checkouts`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': content.asaasapikey
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok && data.url) {
          window.open(data.url, '_blank');
          setShowBillingForm(false);
        } else {
          const errorMsg = data.errors?.[0]?.description || 'Erro ao processar checkout.';
          setErrorState({ message: errorMsg, type: 'api' });
        }
      } catch (err: any) {
        console.error('Erro de requisição:', err);
        
        // Detecção específica de erro de CORS (Failed to fetch)
        if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
          setErrorState({ 
            message: 'O checkout automático foi bloqueado pelo seu navegador (CORS). Isso é uma medida de segurança comum. Por favor, clique abaixo para finalizar via WhatsApp com nosso suporte!', 
            type: 'cors' 
          });
        } else {
          setErrorState({ 
            message: 'Falha na conexão com o sistema de pagamentos.', 
            type: 'network' 
          });
        }
      } finally {
        setPaying(false);
      }
      return;
    }

    // Fallback padrão se não houver API Key
    redirectToWhatsApp();
  };

  const redirectToWhatsApp = () => {
    if (!product) return;
    const msg = `Olá! Gostaria de adquirir o material: *${product.title}* (R$ ${Number(product.price).toFixed(2)}).

*Meus Dados:*
Nome: ${customerData.name || 'Pendente'}
E-mail: ${customerData.email || 'Pendente'}
CPF/CNPJ: ${customerData.cpfCnpj || 'Pendente'}
WhatsApp: ${customerData.phone || 'Pendente'}

Pode me enviar o link de pagamento?`;

    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <Loader2 className="animate-spin text-brand-purple mb-4" size={64} />
      <p className="font-black text-brand-dark uppercase tracking-widest text-sm animate-pulse">Carregando Material...</p>
    </div>
  );

  if (!product) return null;

  return (
    <div className="bg-brand-cream/30 pb-32 pt-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <button 
          onClick={() => onNavigate('products')} 
          className="group flex items-center gap-2 text-brand-purple font-black mb-12 hover:translate-x-[-8px] transition-all"
        >
          <ArrowLeft size={20} className="group-hover:scale-125 transition-transform" /> 
          VOLTAR PARA A VITRINE
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="space-y-8 sticky top-32">
            <div className="relative group">
              <div className="absolute -inset-4 bg-brand-purple/10 rounded-[4.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img 
                src={product.image_url} 
                className="relative w-full rounded-[4rem] shadow-3xl border-8 border-white object-cover aspect-square transition-transform duration-500 group-hover:scale-[1.01]" 
                alt={product.title} 
              />
              <div className="absolute -bottom-8 -right-8 bg-brand-orange text-white p-8 rounded-[2.5rem] shadow-3xl rotate-6 animate-bounce">
                <Zap size={40} fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="bg-brand-purple/10 text-brand-purple px-5 py-2 rounded-full inline-block w-fit text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
              {product.category}
            </div>
            
            <h1 className="text-4xl lg:text-7xl font-black text-brand-dark mb-8 tracking-tighter leading-[0.9] uppercase">
              {product.title}
            </h1>
            
            <div className="h-2 w-24 bg-brand-orange rounded-full mb-10"></div>
            
            <p className="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
              {product.description}
            </p>

            <div className="bg-white p-10 lg:p-14 rounded-[4rem] shadow-3xl border border-brand-lilac/10 relative overflow-hidden group/card">
              <div className="relative z-10">
                <div className="mb-10">
                  {product.old_price && (
                    <p className="text-xl text-gray-300 line-through mb-1 font-bold">De R$ {Number(product.old_price).toFixed(2)}</p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-brand-purple uppercase">Apenas</span>
                    <p className="text-6xl lg:text-7xl font-black text-brand-purple tracking-tighter">
                      R$ {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <button 
                    onClick={() => setShowBillingForm(true)}
                    className="group/btn w-full bg-brand-orange text-white py-8 rounded-[2.5rem] font-black text-2xl lg:text-3xl shadow-2xl hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    <ShoppingCart size={32} /> 
                    ADQUIRIR AGORA
                  </button>
                  <p className="text-gray-400 text-[11px] font-bold text-center flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-green-500" /> Transação Segura via Asaas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBillingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Finalizar Pedido</h3>
              <button onClick={() => setShowBillingForm(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={28} className="text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleCheckout} className="p-10 lg:p-12 overflow-y-auto custom-scrollbar flex-grow">
              {errorState.type && (
                <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-3xl animate-in slide-in-from-top">
                  <div className="flex items-start gap-4 text-red-600 font-bold mb-4">
                    <AlertCircle size={24} className="shrink-0" />
                    <span className="text-sm leading-tight">{errorState.message}</span>
                  </div>
                  {(errorState.type === 'cors' || errorState.type === 'network') && (
                    <div className="space-y-4">
                      <button 
                        type="button"
                        onClick={redirectToWhatsApp}
                        className="w-full bg-green-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                      >
                        <MessageCircle size={20} /> FINALIZAR NO WHATSAPP
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <BillingInput label="Nome Completo" icon={<User size={18}/>} name="name" value={customerData.name} onChange={handleInputChange} required />
                </div>
                <BillingInput label="E-mail" icon={<Mail size={18}/>} name="email" type="email" value={customerData.email} onChange={handleInputChange} required />
                <BillingInput label="CPF ou CNPJ" icon={<FileText size={18}/>} name="cpfCnpj" value={customerData.cpfCnpj} onChange={handleInputChange} required />
                <BillingInput label="WhatsApp" icon={<Phone size={18}/>} name="phone" value={customerData.phone} onChange={handleInputChange} required />
                <BillingInput label="CEP" icon={<MapPin size={18}/>} name="postalCode" value={customerData.postalCode} onChange={handleInputChange} required />
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
                  disabled={paying}
                  className="flex-grow bg-brand-purple text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3"
                >
                  {paying ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={24}/> IR PARA PAGAMENTO</>}
                </button>
                <button 
                  type="button"
                  onClick={redirectToWhatsApp}
                  className="lg:w-1/3 bg-white text-green-500 border-2 border-green-500 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={18} /> WhatsApp
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
