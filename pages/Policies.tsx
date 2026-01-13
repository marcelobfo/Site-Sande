
import React from 'react';
import { ShieldCheck, Calendar, RefreshCcw, Heart, ArrowLeft } from 'lucide-react';
import { View } from '../types';

interface PoliciesProps {
  onNavigate: (view: View) => void;
}

// Fixed: Added PoliciesProps and destructured onNavigate to resolve IntrinsicAttributes error in App.tsx
export const Policies: React.FC<PoliciesProps> = ({ onNavigate }) => {
  return (
    <div className="bg-brand-cream/30 pb-32">
      <section className="bg-brand-purple pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <ShieldCheck size={64} className="mx-auto mb-8 text-brand-orange" />
          <h1 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">Garantia e Políticas</h1>
          <p className="text-xl text-purple-100 font-medium leading-relaxed">
            Sua tranquilidade é nossa prioridade. Conheça nosso compromisso de satisfação.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-3xl border border-brand-lilac/20">
          <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
            <div className="bg-brand-orange/20 text-brand-orange p-10 rounded-full">
              <span className="text-6xl font-black leading-none">7</span>
              <p className="text-xs font-black uppercase tracking-widest mt-2">Dias</p>
            </div>
            <div>
              <h2 className="text-4xl font-black text-brand-dark mb-4">Garantia Incondicional</h2>
              <p className="text-xl text-gray-500 leading-relaxed font-medium">
                Você tem 7 dias inteiros para testar o Método Protagonizar. Use os materiais, assista às aulas e personalize no Canva. Se não amar, basta um clique.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <Calendar className="text-brand-purple mb-4" size={32} />
              <h4 className="font-black text-xl text-brand-dark mb-2">Prazo de 7 Dias</h4>
              <p className="text-gray-500 font-medium">Contados a partir da data de liberação do seu acesso à plataforma.</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <RefreshCcw className="text-brand-purple mb-4" size={32} />
              <h4 className="font-black text-xl text-brand-dark mb-2">Estorno Total</h4>
              <p className="text-gray-500 font-medium">O reembolso é de 100% do valor pago, sem taxas ocultas ou multas.</p>
            </div>
          </div>

          <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed">
            <h3 className="text-2xl font-black text-brand-dark mb-6">Como solicitar o reembolso?</h3>
            <p className="mb-4">
              Para solicitar a devolução, você pode fazer diretamente pela plataforma de pagamento or entrar em contato com nossa equipe de suporte através do e-mail <strong>suporte@metodoprotagonizar.com.br</strong> informando o número do seu pedido.
            </p>
            <p className="mb-8">
              O processamento do estorno ocorre de forma automática. Se você pagou via Cartão de Crédito, o valor aparecerá na sua próxima fatura. Se foi via Pix, o valor retorna para sua conta em poucos minutos após o processamento.
            </p>
            
            <div className="bg-brand-lilac/20 p-8 rounded-[2rem] border border-brand-lilac/30 flex items-start gap-6">
              <Heart className="text-brand-purple shrink-0 mt-1" />
              <p className="text-brand-dark font-black leading-relaxed">
                Queremos apenas professores satisfeitos e empolgados. Se o método não é o que você esperava agora, respeitamos sua decisão e mantemos as portas abertas para o futuro!
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('home')}
          className="mt-12 flex items-center gap-2 text-brand-purple font-black mx-auto hover:gap-4 transition-all"
        >
          <ArrowLeft size={18} /> VOLTAR PARA A HOME
        </button>
      </div>
    </div>
  );
};
