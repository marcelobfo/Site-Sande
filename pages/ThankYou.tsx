
import React from 'react';
import { CheckCircle2, ArrowRight, Heart, Star, Sparkles, Gem, ArrowUpRight } from 'lucide-react';
import { View } from '../types';

interface ThankYouProps {
  onNavigate: (view: View) => void;
}

export const ThankYou: React.FC<ThankYouProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center p-6 text-center">
      <div className="max-w-4xl w-full bg-white p-12 lg:p-24 rounded-[4rem] shadow-3xl border-2 border-brand-purple/10 relative overflow-hidden">
        {/* Decorativos */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10">
          <div className="bg-green-100 text-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg animate-bounce">
            <CheckCircle2 size={56} />
          </div>
          
          <h1 className="text-4xl lg:text-7xl font-black text-brand-dark mb-6 leading-tight tracking-tighter">
            Parabéns pela <br/> <span className="text-brand-purple">Sua Decisão!</span> 🚀
          </h1>
          
          <p className="text-2xl text-gray-500 mb-12 font-medium leading-relaxed">
            Seu pedido foi processado com sucesso. Você acaba de dar um grande passo para se tornar uma <span className="text-brand-orange font-black">Professora Protagonista</span>.
          </p>

          <div className="bg-brand-purple p-8 rounded-[2.5rem] mb-12 border border-white/10 shadow-2xl relative">
             <div className="absolute -top-4 -right-4 bg-brand-orange text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Próximos Passos</div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-black">1</div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-lilac">Confirme seu E-mail</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-black">2</div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-lilac">Acesse a Plataforma</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-black">3</div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-brand-lilac">Baixe seu Material</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate('home')}
              className="bg-brand-dark text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 group"
            >
              VOLTAR AO SITE <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
            <a 
              href="https://wa.me/5533999872505"
              className="bg-green-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              PREISO DE AJUDA
            </a>
          </div>

          <div className="mt-16 pt-10 border-t flex flex-col items-center gap-4">
             <div className="flex gap-1 text-brand-orange">
               {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={24} />)}
             </div>
             <p className="text-xs font-black text-brand-purple uppercase tracking-[0.2em] flex items-center gap-2">
               <Heart size={16} fill="currentColor" /> MÉTODO PROTAGONIZAR
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
