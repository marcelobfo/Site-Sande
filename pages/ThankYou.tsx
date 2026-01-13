
import React from 'react';
import { CheckCircle2, ArrowRight, Heart, Star } from 'lucide-react';
import { View } from '../types';

interface ThankYouProps {
  onNavigate: (view: View) => void;
}

export const ThankYou: React.FC<ThankYouProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center p-6 text-center">
      <div className="max-w-3xl w-full bg-white p-12 lg:p-24 rounded-[4rem] shadow-3xl border-2 border-brand-purple/10 relative overflow-hidden">
        {/* Decorativos */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-orange/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="bg-green-100 text-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg animate-in zoom-in duration-500">
            <CheckCircle2 size={56} />
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black text-brand-dark mb-6 leading-tight tracking-tighter">
            Recebemos seu <br/> <span className="text-brand-purple">Briefing!</span> 🚀
          </h1>
          
          <p className="text-2xl text-gray-500 mb-10 font-medium leading-relaxed">
            Estamos empolgados em dar o próximo passo na criação do seu site. Analisaremos seus dados e entraremos em contato em breve.
          </p>

          <div className="flex justify-center gap-1 text-brand-orange mb-10">
            {[1,2,3,4,5].map(i => <Star key={i} fill="currentColor" size={20} />)}
          </div>

          <div className="h-1 w-24 bg-brand-orange mx-auto mb-10 rounded-full"></div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate('home')}
              className="bg-brand-purple text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              VOLTAR AO INÍCIO <ArrowRight size={20} />
            </button>
            <a 
              href="https://wa.me/5533999872505"
              className="bg-green-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              FALAR NO WHATSAPP
            </a>
          </div>

          <p className="mt-12 text-sm font-black text-brand-purple flex items-center justify-center gap-2">
            <Heart size={16} fill="currentColor" /> Método Protagonizar & Lax Serviços
          </p>
        </div>
      </div>
    </div>
  );
};
