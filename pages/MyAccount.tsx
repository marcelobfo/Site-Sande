
import React, { useState, useEffect } from 'react';
// Added ShieldCheck and Gem to the imports
import { Package, Download, ExternalLink, Loader2, Sparkles, Heart, Clock, AlertCircle, CheckCircle2, Lock, ArrowRight, RefreshCcw, ShieldCheck, Gem } from 'lucide-react';
import { View, Lead, Product } from '../types';
import { supabase } from '../lib/supabase';

interface MyAccountProps {
  onNavigate: (view: View) => void;
  user: any;
}

export const MyAccount: React.FC<MyAccountProps> = ({ onNavigate, user }) => {
  const [purchases, setPurchases] = useState<(Lead & { product_details?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchPurchases = async () => {
    if (!user) return;
    setIsSyncing(true);
    
    // 1. Busca os leads (compras) do usuário
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (leads) {
      // 2. Busca os detalhes dos produtos correspondentes
      const productIds = Array.from(new Set(leads.map(l => l.product_id).filter(Boolean)));
      
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      const enrichedPurchases = leads.map(lead => ({
        ...lead,
        product_details: products?.find(p => p.id === lead.product_id)
      }));

      setPurchases(enrichedPurchases);
    }
    setLoading(false);
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchPurchases();

    // ESCUTA EM TEMPO REAL: Se o status mudar no banco de dados, a UI atualiza sozinha!
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads',
          filter: `email=eq.${user.email}`,
        },
        (payload) => {
          console.log('Pagamento atualizado em tempo real!', payload);
          fetchPurchases(); // Recarrega os dados para refletir o novo status e liberar downloads
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDownload = (item: Lead & { product_details?: Product }) => {
    const link = item.product_details?.download_url;
    if (link) {
      window.open(link, '_blank');
    } else {
      alert("Este material ainda não possui um link cadastrado pela administração.");
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
      <p className="font-black text-brand-dark uppercase tracking-widest text-xs mt-4">Sincronizando seus acessos...</p>
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
               {isSyncing && (
                 <span className="flex items-center gap-2 text-[10px] font-black text-brand-orange animate-pulse uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                   <RefreshCcw size={12} className="animate-spin" /> Verificando Pagamentos
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
        {purchases.length === 0 ? (
          <div className="bg-white p-20 rounded-[4rem] shadow-3xl text-center space-y-8 border border-brand-lilac/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16"></div>
             <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-gray-200">
                <Package size={48} />
             </div>
             <div className="max-w-md mx-auto">
               <h3 className="text-2xl font-black text-brand-dark mb-4">Sua estante está vazia.</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Seus materiais aparecerão aqui assim que o primeiro pagamento for identificado.</p>
             </div>
             <button onClick={() => onNavigate('products')} className="bg-brand-purple text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                EXPLORAR VITRINE
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchases.map(item => {
              const isPaid = item.status === 'Pago' || item.status === 'Fechado';
              const isAwaiting = item.status === 'Aguardando Pagamento';
              
              return (
                <div key={item.id} className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-brand-lilac/10 group hover:shadow-2xl transition-all relative">
                   <div className="p-8 md:p-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div className={`p-4 rounded-2xl transition-colors ${isPaid ? 'bg-green-50 text-green-600' : isAwaiting ? 'bg-brand-orange/10 text-brand-orange' : 'bg-gray-100 text-gray-400'}`}>
                            {isPaid ? <CheckCircle2 size={32} /> : <Clock size={32} />}
                         </div>
                         
                         <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                           isPaid ? 'bg-green-500 text-white border-green-600' : 
                           isAwaiting ? 'bg-brand-orange text-white border-brand-orange' : 
                           'bg-red-50 text-red-500 border-red-100'
                         }`}>
                           {item.status}
                         </div>
                      </div>

                      <div>
                         <h3 className="text-2xl font-black text-brand-dark leading-tight line-clamp-2 min-h-[4rem] group-hover:text-brand-purple transition-colors">
                            {item.product_name || "Material Educativo"}
                         </h3>
                         <div className="flex items-center gap-4 mt-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Package size={12} /> {item.product_details?.category || 'Geral'}
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                               <Clock size={12} /> {new Date(item.created_at).toLocaleDateString()}
                            </p>
                         </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50">
                        {isPaid ? (
                          <div className="space-y-3">
                            <button 
                              onClick={() => handleDownload(item)}
                              className="w-full bg-brand-purple text-white py-5 rounded-2xl font-black text-sm shadow-lg hover:bg-brand-dark transition-all flex items-center justify-center gap-3 group/btn"
                            >
                              <Download size={18} className="group-hover/btn:translate-y-1 transition-transform" /> 
                              {item.product_details?.download_url ? 'BAIXAR MATERIAL' : 'AGUARDANDO LINK'}
                            </button>
                            <p className="text-[9px] font-black text-center text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                               <ShieldCheck size={12} className="text-green-500" /> Acesso Permanente Liberado
                            </p>
                          </div>
                        ) : isAwaiting ? (
                          <div className="bg-brand-cream/50 p-6 rounded-2xl border border-brand-orange/10 space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-brand-orange rounded-full animate-ping"></div>
                                <p className="text-xs font-black text-brand-dark uppercase tracking-tight">Pagamento em análise</p>
                             </div>
                             <p className="text-[11px] font-bold text-gray-500 leading-relaxed">Assim que o Asaas confirmar o recebimento, este card ficará roxo e o botão de download aparecerá automaticamente.</p>
                             <button 
                              onClick={() => window.open(`https://wa.me/5533999872505?text=Olá! Fiz o pagamento de ${item.product_name} mas ainda não liberou no portal.`, '_blank')}
                              className="w-full bg-white border-2 border-brand-orange/20 text-brand-orange py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-brand-orange hover:text-white transition-all"
                             >
                               Enviar Comprovante <ArrowRight size={12} />
                             </button>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-red-50 rounded-2xl">
                             <p className="text-xs font-black text-red-500 uppercase tracking-widest">Compra Cancelada</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}

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
    </div>
  );
};
