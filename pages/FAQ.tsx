
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';
import { View } from '../types';

interface FAQProps {
  onNavigate: (view: View) => void;
}

const faqData = [
  {
    question: "Como recebo o acesso aos materiais?",
    answer: "Imediatamente após a confirmação do pagamento, você receberá um e-mail com seus dados de acesso à nossa plataforma exclusiva. Lá você encontrará todos os manuais, links do Canva e videoaulas."
  },
  {
    question: "O Clube Professora Protagonista é mensal ou anual?",
    answer: "A assinatura é anual, garantindo 12 meses de acesso a todos os materiais novos que são postados semanalmente, além das aulas especiais e suporte da comunidade."
  },
  {
    question: "Posso editar os materiais no celular?",
    answer: "Sim! Os materiais são editáveis através do aplicativo gratuito do Canva (disponível para Android e iOS) ou diretamente pelo navegador no seu computador."
  },
  {
    question: "Os materiais seguem a BNCC?",
    answer: "Com certeza. Todos os planejamentos e atividades são construídos com foco total nas competências e habilidades previstas pela Base Nacional Comum Curricular."
  },
  {
    question: "Como funciona a garantia de 7 dias?",
    answer: "Nós confiamos tanto no Método Protagonizar que oferecemos 7 dias de garantia incondicional. Se você entrar e sentir que não é para você, basta solicitar o reembolso e devolvemos 100% do seu valor."
  },
  {
    question: "Tenho suporte para tirar dúvidas?",
    answer: "Sim! Temos um canal de atendimento via WhatsApp e e-mail para ajudar você com qualquer dificuldade técnica ou dúvida pedagógica sobre os materiais."
  }
];

// Fixed: Added FAQProps and destructured onNavigate to resolve IntrinsicAttributes error in App.tsx
export const FAQ: React.FC<FAQProps> = ({ onNavigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-brand-cream/30 pb-32">
      <section className="bg-brand-purple pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <HelpCircle size={64} className="mx-auto mb-8 text-brand-orange animate-bounce" />
          <h1 className="text-5xl lg:text-6xl font-black mb-8 leading-tight">Perguntas Frequentes</h1>
          <p className="text-xl text-purple-100 font-medium leading-relaxed">
            Tudo o que você precisa saber para começar a protagonizar na sua escola.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-3xl overflow-hidden border border-brand-lilac/20">
          {faqData.map((item, idx) => (
            <div key={idx} className="border-b border-gray-100 last:border-0">
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-8 text-left hover:bg-brand-cream/20 transition-all"
              >
                <span className="text-xl font-black text-brand-dark leading-tight">{item.question}</span>
                {openIndex === idx ? <ChevronUp className="text-brand-purple" /> : <ChevronDown className="text-gray-300" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="p-8 pt-0 text-gray-500 font-medium text-lg leading-relaxed bg-brand-cream/10">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-500 font-bold mb-8">Ainda tem alguma dúvida específica?</p>
          <button 
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-3 bg-brand-orange text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all"
          >
            FALAR COM O SUPORTE <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};
