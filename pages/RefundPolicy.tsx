
import React from 'react';
import { ShieldCheck, Calendar, RefreshCcw, Heart, ArrowLeft, MessageCircle, ArrowRight } from 'lucide-react';
import { View, SiteContent } from '../types';

interface RefundPolicyProps {
  onNavigate: (view: View) => void;
  content: SiteContent;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onNavigate, content }) => {
  const handleWhatsappRefund = () => {
    const msg = "Olá! Gostaria de solicitar o reembolso de um material adquirido conforme a garantia de 7 dias.";
    window.open(`https://wa.me/${content.supportwhatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-brand-cream/30 pb-32">
      <section className="bg-brand-purple pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <RefreshCcw size={64} className="mx-auto mb-8 text-brand-orange animate-spin-slow" />
          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase">Satisfação Garantida</h1>
          <p className="text-xl text-purple-100 font-medium leading-relaxed max-w-2xl mx-auto">
            Nosso compromisso é com o seu protagonismo. Se você não ficar satisfeita, nós devolvemos o seu dinheiro.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white p-10 lg:p-20 rounded-[4rem] shadow-3xl border border-brand-lilac/20">
          <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
            <div className="bg-brand-orange text-white p-12 rounded-[3rem] shadow-2xl rotate-3">
              <span className="text-7xl font-black leading-none">7</span>
              <p className="text-xs font-black uppercase tracking-widest mt-2">Dias</p>
            </div>
            <div>
              <h2 className="text-4xl font-black text-brand-dark mb-4">Garantia Incondicional</h2>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Você tem 7 dias corridos para testar nossos materiais. Se sentir que não é o momento ou o material não atende suas expectativas, devolvemos 100% do valor.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 group hover:border-brand-purple transition-all">
              <Calendar className="text-brand-purple mb-6" size={40} />
              <h4 className="font-black text-2xl text-brand-dark mb-3">Sem Perguntas</h4>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">Não precisa justificar. A garantia é um direito seu e respeitamos sua decisão.</p>
            </div>
            <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 group hover:border-brand-orange transition-all">
              <ShieldCheck className="text-brand-orange mb-6" size={40} />
              <h4 className="font-black text-2xl text-brand-dark mb-3">Estorno Ágil</h4>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">Processamos seu pedido em até 48h úteis após o contato inicial.</p>
            </div>
          </div>

          <div className="bg-brand-dark text-white p-12 rounded-[3.5rem] mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
               <MessageCircle className="text-brand-orange" size={32} /> Como Solicitar?
            </h3>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
              Basta clicar no botão abaixo para ser redirecionada ao nosso canal de suporte oficial. Informe o seu e-mail de compra para agilizar o processo.
            </p>
            <button 
              onClick={handleWhatsappRefund}
              className="w-full bg-brand-orange text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
            >
              SOLICITAR REEMBOLSO VIA WHATSAPP <ArrowRight />
            </button>
          </div>

          <div className="flex items-start gap-6 p-8 bg-brand-cream/50 rounded-3xl border-2 border-dashed border-brand-lilac/30">
            <Heart className="text-brand-pink shrink-0 mt-1" size={24} fill="currentColor" />
            <p className="text-brand-dark font-black text-sm uppercase tracking-tight leading-relaxed">
              O Método Protagonizar valoriza sua confiança. Nosso objetivo é ter apenas alunas plenamente satisfeitas.
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('home')}
          className="mt-12 flex items-center gap-2 text-brand-purple font-black mx-auto hover:gap-4 transition-all"
        >
          <ArrowLeft size={18} /> VOLTAR PARA A HOME
        </button>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};
