
import React, { useState } from 'react';
import { Send, FileText, Globe, Palette, Rocket, CheckCircle2, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { View } from '../types';

interface BriefingProps {
  onNavigate: (view: View) => void;
}

const WEBHOOK_URL = 'https://atendimento-creditar-n8n.stpanz.easypanel.host/webhook/briefing';

export const Briefing: React.FC<BriefingProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    empresa: '',
    responsavel: '',
    email: '',
    whatsapp: '',
    objetivo: '',
    referencias: '',
    cores: '',
    funcionalidades: '',
    observacoes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sent_at: new Date().toISOString(),
          origin: 'Site Institucional - Briefing'
        })
      });

      if (response.ok) {
        onNavigate('thank-you');
      } else {
        throw new Error('Erro ao enviar webhook');
      }
    } catch (err) {
      console.error(err);
      alert('Houve um erro no envio. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-12">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${step === s ? 'bg-brand-purple text-white shadow-lg' : s < step ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {s < step ? <CheckCircle2 size={20} /> : s}
          </div>
          {s < 3 && <div className="w-12 h-1 bg-gray-100 rounded-full"></div>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-brand-cream/30 min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-[4rem] shadow-3xl border border-brand-lilac/20 overflow-hidden">
        <div className="bg-brand-purple p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 skew-y-6"></div>
          <FileText size={48} className="mx-auto mb-6 text-brand-orange" />
          <h1 className="text-4xl font-black mb-4">Briefing de Projeto</h1>
          <p className="text-purple-100 font-medium">Conte-nos mais sobre o site institucional que você imagina.</p>
        </div>

        <div className="p-12">
          <StepIndicator />

          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-black text-brand-dark mb-8 flex items-center gap-3">
                  <Rocket className="text-brand-purple" /> Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label-briefing">Nome da Empresa / Projeto</label>
                    <input required name="empresa" value={formData.empresa} onChange={handleChange} className="input-briefing" placeholder="Ex: Lax Serviços Educacionais" />
                  </div>
                  <div>
                    <label className="label-briefing">Nome do Responsável</label>
                    <input required name="responsavel" value={formData.responsavel} onChange={handleChange} className="input-briefing" placeholder="Seu nome completo" />
                  </div>
                  <div>
                    <label className="label-briefing">E-mail de Contato</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-briefing" placeholder="contato@empresa.com" />
                  </div>
                  <div>
                    <label className="label-briefing">WhatsApp</label>
                    <input required name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="input-briefing" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-black text-brand-dark mb-8 flex items-center gap-3">
                  <Globe className="text-brand-purple" /> Objetivos e Referências
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="label-briefing">Qual o objetivo principal do site?</label>
                    <textarea name="objetivo" value={formData.objetivo} onChange={handleChange} rows={3} className="input-briefing resize-none" placeholder="Venda de produtos, institucional, geração de leads..."></textarea>
                  </div>
                  <div>
                    <label className="label-briefing">Referências de sites que você gosta</label>
                    <textarea name="referencias" value={formData.referencias} onChange={handleChange} rows={3} className="input-briefing resize-none" placeholder="Ex: clubedasprofs.com.br, novaescola.org.br..."></textarea>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-2xl font-black text-brand-dark mb-8 flex items-center gap-3">
                  <Palette className="text-brand-purple" /> Identidade e Funções
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="label-briefing">Cores de preferência ou marca</label>
                    <input name="cores" value={formData.cores} onChange={handleChange} className="input-briefing" placeholder="Lilás, roxo, laranja..." />
                  </div>
                  <div>
                    <label className="label-briefing">Funcionalidades desejadas</label>
                    <textarea name="funcionalidades" value={formData.funcionalidades} onChange={handleChange} rows={3} className="input-briefing resize-none" placeholder="Blog, Loja, WhatsApp, E-mail Marketing..."></textarea>
                  </div>
                  <div>
                    <label className="label-briefing">Observações adicionais</label>
                    <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="input-briefing resize-none"></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-12 border-t mt-12">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 font-black text-gray-400 hover:text-brand-dark transition-all">
                  <ArrowLeft /> VOLTAR
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="bg-brand-purple text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                  PRÓXIMO PASSO <ArrowRight size={20} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="bg-brand-orange text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> ENVIAR BRIEFING</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .label-briefing { display: block; font-size: 0.75rem; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .input-briefing { width: 100%; padding: 1.25rem 1.5rem; background-color: #F8FAFC; border-radius: 1.5rem; border: 2px solid transparent; font-weight: 700; color: #1E1B4B; outline: none; transition: all 0.2s; }
        .input-briefing:focus { border-color: #7E22CE; background-color: #FFFFFF; }
      `}</style>
    </div>
  );
};
