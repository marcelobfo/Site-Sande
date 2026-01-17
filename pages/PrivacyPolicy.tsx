
import React from 'react';
import { FileText, Lock, Eye, ShieldCheck, ArrowLeft, Globe } from 'lucide-react';
import { View } from '../types';

interface PrivacyPolicyProps {
  onNavigate: (view: View) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
  return (
    <div className="bg-brand-cream/30 pb-32">
      <section className="bg-brand-dark pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <Lock size={64} className="mx-auto mb-8 text-brand-purple" />
          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase">Privacidade</h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Suas informações são tratadas com o máximo respeito e segurança, de acordo com a LGPD.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white p-10 lg:p-20 rounded-[4rem] shadow-3xl border border-brand-lilac/20">
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-black text-brand-dark mb-6 flex items-center gap-3">
                <ShieldCheck className="text-brand-purple" /> 1. Coleta de Dados
              </h2>
              <div className="prose prose-purple text-gray-500 font-medium text-lg leading-relaxed">
                <p>Coletamos informações essenciais para a prestação dos nossos serviços, tais como nome, e-mail, telefone e dados de faturamento (CPF/CNPJ e endereço). Esses dados são necessários para a emissão de notas fiscais e liberação do acesso à plataforma.</p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-brand-dark mb-6 flex items-center gap-3">
                <Eye className="text-brand-purple" /> 2. Uso das Informações
              </h2>
              <div className="prose prose-purple text-gray-500 font-medium text-lg leading-relaxed">
                <p>Seus dados são utilizados exclusivamente para:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Garantir o acesso aos materiais adquiridos;</li>
                  <li>Enviar atualizações sobre o Método Protagonizar;</li>
                  <li>Atendimento via suporte (WhatsApp/E-mail);</li>
                  <li>Melhoria da experiência do usuário no site.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-black text-brand-dark mb-6 flex items-center gap-3">
                <Globe className="text-brand-purple" /> 3. Compartilhamento
              </h2>
              <div className="prose prose-purple text-gray-500 font-medium text-lg leading-relaxed">
                <p>Não vendemos ou alugamos seus dados pessoais para terceiros. O compartilhamento ocorre apenas com parceiros essenciais, como processadores de pagamento (Asaas) e ferramentas de automação (n8n), sempre sob rígidos protocolos de segurança.</p>
              </div>
            </section>

            <section className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
              <h2 className="text-2xl font-black text-brand-dark mb-4">Seus Direitos</h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                Você tem o direito de solicitar a correção, atualização ou exclusão definitiva dos seus dados a qualquer momento. Para isso, entre em contato com <strong>privacidade@metodoprotagonizar.com.br</strong>.
              </p>
            </section>

            <div className="pt-10 border-t flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
               <FileText size={20} /> Última atualização: Fevereiro de 2026
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
