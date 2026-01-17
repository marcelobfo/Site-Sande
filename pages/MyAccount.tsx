
import React, { useState, useEffect } from 'react';
import { Package, Download, ExternalLink, Loader2, Sparkles, Heart, Clock, AlertCircle } from 'lucide-react';
import { View, Lead, Product } from '../types';
import { supabase } from '../lib/supabase';

interface MyAccountProps {
  onNavigate: (view: View) => void;
  user: any;
}

export const MyAccount: React.FC<MyAccountProps> = ({ onNavigate, user }) => {
  const [purchases, setPurchases] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPurchases = async () => {
      // Busca no CRM (leads) todas as compras deste e-mail com status Pago ou Fechado
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', user.email)
        .in('status', ['Pago', 'Fechado', 'Em Contato'])
        .order('created_at', { ascending: false });

      if (data) setPurchases(data);
      setLoading(false);
    };

    fetchPurchases();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream/30">
      <Loader2 className="animate-spin text-brand-purple mb-4" size={48} />
      <p className="font-black text-brand-dark uppercase tracking-widest text-xs">Acessando seus materiais...</p>
    </div>
  );

  return (
    <div className="bg-brand-cream/30 min-h-screen pb-32">
      <section className="bg-brand-dark pt-16 pb-32 text-white px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-brand-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-lilac">Área da Aluna Protagonista</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Meus <span className="text-brand-orange">Materiais</span></h1>
            <p className="text-gray-400 mt-2 font-medium">Bem-vinda de volta, {user.email.split('@')[0]}!</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4 backdrop-blur-md">
             <div className="w-12 h-12 bg-brand-orange rounded-full flex items-center justify-center font-black text-xl">
               {user.email[0].toUpperCase()}
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sua Conta</p>
               <p className="font-bold text-sm text-white">{user.email}</p>
             </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {purchases.length === 0 ? (
          <div className="bg-white p-20 rounded-[4rem] shadow-3xl text-center space-y-8 border border-brand-lilac/20">
             <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-gray-200">
                <Package size={48} />
             </div>
             <div className="max-w-md mx-auto">
               <h3 className="text-2xl font-black text-brand-dark mb-4">Ainda não encontramos suas compras.</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Se você já adquiriu um material, certifique-se de estar usando o mesmo e-mail utilizado no checkout.</p>
             </div>
             <button onClick={() => onNavigate('products')} className="bg-brand-purple text-white px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                IR PARA A LOJA AGORA
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {purchases.map(item => (
              <div key={item.id} className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-brand-lilac/10 group hover:shadow-2xl transition-all">
                 <div className="p-8 md:p-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="bg-brand-purple/10 p-4 rounded-2xl text-brand-purple">
                          <Package size={32} />
                       </div>
                       <span className="bg-green-100 text-green-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200">
                          Acesso Liberado
                       </span>
                    </div>

                    <div>
                       <h3 className="text-2xl font-black text-brand-dark leading-tight line-clamp-2 min-h-[4rem] group-hover:text-brand-purple transition-colors">
                          {item.product_name || "Material Educativo"}
                       </h3>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <Clock size={12} /> Adquirido em: {new Date(item.created_at).toLocaleDateString()}
                       </p>
                    </div>

                    <div className="pt-6 border-t border-gray-50 space-y-3">
                       <button 
                        onClick={() => window.open(`https://wa.me/5533999872505?text=Preciso de ajuda com meu material: ${item.product_name}`, '_blank')}
                        className="w-full bg-gray-50 text-gray-500 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-purple/5 hover:text-brand-purple transition-all flex items-center justify-center gap-2">
                          Precisa de ajuda?
                       </button>
                       <button className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-sm shadow-lg hover:bg-brand-dark transition-all flex items-center justify-center gap-3">
                          <Download size={18} /> BAIXAR MATERIAL
                       </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 p-12 bg-white rounded-[4rem] border border-dashed border-brand-lilac/30 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6 text-center md:text-left">
              <div className="bg-brand-orange/10 p-4 rounded-full text-brand-orange">
                <Heart size={32} fill="currentColor" />
              </div>
              <div>
                <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight">Clube Professora Protagonista</h4>
                <p className="text-gray-500 font-medium">Acesso a todos os materiais por apenas um valor anual.</p>
              </div>
           </div>
           <button onClick={() => onNavigate('products')} className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all">
              SABER MAIS
           </button>
        </div>
      </div>
    </div>
  );
};
