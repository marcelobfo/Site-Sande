
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingCart, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { Product, View, SiteContent } from '../types';
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

  const handleCheckout = async () => {
    if (!product) return;

    // PRIORIDADE 1: Se o administrador cadastrou um link manual (Asaas ou Hotmart), usamos ele.
    if (product.checkout_url && product.checkout_url.startsWith('http')) {
      window.open(product.checkout_url, '_blank');
      return;
    }

    // PRIORIDADE 2: Geração dinâmica via API Asaas (/v3/checkouts) conforme documentação
    if (content.asaasapikey) {
      setPaying(true);
      try {
        const baseUrl = content.asaasissandbox 
          ? 'https://api-sandbox.asaas.com/v3' 
          : 'https://api.asaas.com/v3';

        const response = await fetch(`${baseUrl}/checkouts`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'access_token': content.asaasapikey
          },
          body: JSON.stringify({
            billingTypes: ["CREDIT_CARD", "PIX", "BOLETO"],
            chargeTypes: ["DETACHED"], // Cobrança única (avulsa)
            minutesToExpire: 120,
            items: [
              {
                name: product.title,
                description: `Material Digital: ${product.title} - Professora Sande Almeida`,
                value: product.price,
                quantity: 1
              }
            ],
            callback: {
              successUrl: `${window.location.origin}/#thank-you`,
              cancelUrl: window.location.href
            }
          })
        });

        const data = await response.json();
        
        if (response.ok && data.url) {
          window.open(data.url, '_blank');
        } else {
          throw new Error(data.errors?.[0]?.description || 'Erro na API Asaas');
        }
      } catch (err: any) {
        // Fallback automático para WhatsApp caso falte API ou ocorra erro de CORS
        console.warn('Checkout automático falhou (possível CORS). Redirecionando para WhatsApp...');
        const waMsg = `Olá Professora Sande! Gostaria de adquirir o material: *${product.title}* (R$ ${Number(product.price).toFixed(2)}). O checkout dinâmico não carregou, pode me enviar o link por aqui?`;
        window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(waMsg)}`, '_blank');
      } finally {
        setPaying(false);
      }
      return;
    }

    // PRIORIDADE 3: Fallback Direto WhatsApp
    const fallbackMsg = `Olá Sande! Gostaria de comprar o material: *${product.title}* (Valor: R$ ${Number(product.price).toFixed(2)}). Como posso realizar o pagamento?`;
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(fallbackMsg)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <Loader2 className="animate-spin text-brand-purple mb-4" size={64} />
      <p className="font-black text-brand-dark uppercase tracking-widest text-sm animate-pulse">Preparando Material...</p>
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
            
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <ShieldCheck size={24} />, label: "7 Dias de Garantia", color: "text-brand-purple" },
                { icon: <Zap size={24} />, label: "Download Instantâneo", color: "text-brand-orange" },
                { icon: <CheckCircle2 size={24} />, label: "Canva Editável", color: "text-green-500" }
              ].map((item, i) => (
                <div key={i} className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-lilac/20 text-center shadow-sm">
                  <div className={`mx-auto mb-2 flex justify-center ${item.color}`}>{item.icon}</div>
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-tight leading-tight">{item.label}</p>
                </div>
              ))}
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
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/5 rounded-full -mr-24 -mt-24 group-hover/card:scale-150 transition-transform duration-1000"></div>
              
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
                    onClick={handleCheckout}
                    disabled={paying}
                    className="group/btn w-full bg-brand-orange text-white py-8 rounded-[2.5rem] font-black text-2xl lg:text-3xl shadow-2xl shadow-orange-200 hover:bg-brand-dark hover:shadow-purple-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                  >
                    {paying ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="animate-spin" size={32} />
                        <span>PROCESSANDO...</span>
                      </div>
                    ) : (
                      <>
                        <ShoppingCart size={32} className="group-hover/btn:rotate-12 transition-transform" /> 
                        QUERO ESTE MATERIAL
                      </>
                    )}
                  </button>

                  <div className="flex flex-col items-center gap-5 text-center">
                    <p className="text-gray-400 text-[11px] font-bold flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-500" /> 
                      Pagamento Seguro e Processado via Asaas
                    </p>
                    <div className="flex gap-5 opacity-40 hover:opacity-100 transition-opacity duration-500">
                      <img src="https://logodownload.org/wp-content/uploads/2014/10/visa-logo-1.png" className="h-4 w-auto grayscale" alt="Visa" />
                      <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-7.png" className="h-4 w-auto grayscale" alt="Mastercard" />
                      <img src="https://logodownload.org/wp-content/uploads/2020/02/pix-logo-1.png" className="h-4 w-auto grayscale" alt="Pix" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
