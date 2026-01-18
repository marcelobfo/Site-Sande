
import React, { useState } from 'react';
import { Send, Phone, Mail, Clock, Instagram, MessageCircle, Heart, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { SiteContent, View } from '../types';
import { supabase } from '../lib/supabase';
import { NotificationType } from '../components/Notification';

interface ContactProps {
  content: SiteContent;
  onNavigate?: (view: View) => void;
  notify?: (type: NotificationType, title: string, message: string) => void;
}

const WEBHOOK_URL = 'https://atendimento-creditar-n8n.stpanz.easypanel.host/webhook/briefing';

export const Contact: React.FC<ContactProps> = ({ content, onNavigate, notify }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Salva no Supabase (CRM Interno) - Explicitamente mapeando campos
      const { error: supabaseError } = await supabase
        .from('leads')
        .insert([{ 
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          subject: formData.subject,
          message: formData.message,
          status: 'Novo', 
          created_at: new Date().toISOString() 
        }]);

      if (supabaseError) throw supabaseError;

      // 2. Envia para o Webhook (Automação n8n)
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            origin: 'Formulário de Contato',
            thank_you_url: `${window.location.origin}/#thank-you`,
            description_context: `Contato via Site: ${formData.subject} - Mensagem: ${formData.message}`,
            sent_at: new Date().toISOString()
          })
        });
      } catch (webhookErr) {
        console.warn('Falha ao enviar para o webhook, mas lead salvo no DB:', webhookErr);
      }
      
      // 3. Redirecionamento para Página de Obrigado
      if (onNavigate) {
        onNavigate('thank-you');
      } else {
        if (notify) {
          notify('success', 'Mensagem Enviada', 'Sua mensagem foi enviada com sucesso!');
        } else {
          alert("Mensagem enviada com sucesso!");
        }
        setFormData({ name: '', email: '', whatsapp: '', subject: '', message: '' });
      }
    } catch (err: any) {
      console.error('Error submitting lead:', err);
      const errorMessage = 'Erro ao enviar mensagem. Certifique-se de que a coluna "whatsapp" existe na tabela "leads" do seu Supabase.';
      if (notify) {
        notify('error', 'Erro no Envio', err.message || errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-cream/30 pb-32">
      <section className="bg-brand-purple pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-brand-dark/10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tighter uppercase">Vamos protagonizar?</h1>
          <p className="text-xl text-purple-100 font-medium max-w-2xl mx-auto">
            Dúvidas, sugestões ou parcerias? Nossa equipe está pronta para te atender com carinho.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulário */}
          <div className="bg-white p-10 lg:p-20 rounded-[4rem] shadow-3xl border border-brand-lilac/20 relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-2xl font-black text-brand-dark mb-8 flex items-center gap-3">
                <Send className="text-brand-orange" /> Envie um E-mail
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Seu Nome Completo</label>
                  <input required name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="contact-input" placeholder="Ex: Maria Silva" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">E-mail</label>
                    <input required type="email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="contact-input" placeholder="exemplo@email.com" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="contact-input" placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Assunto</label>
                  <input required name="subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="contact-input" placeholder="Ex: Dúvida sobre o Clube" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Sua Mensagem</label>
                  <textarea required rows={5} name="message" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="contact-input resize-none" placeholder="Conte-nos como podemos te ajudar..."></textarea>
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-brand-orange text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-brand-dark hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Send size={24} /> ENVIAR AGORA</>}
              </button>
            </form>
          </div>

          {/* Info Side */}
          <div className="flex flex-col gap-10">
            <div className="bg-brand-dark p-12 rounded-[4rem] text-white shadow-3xl">
              <h3 className="text-3xl font-black mb-10 tracking-tight">Atendimento Direto</h3>
              <div className="space-y-10">
                <div className="flex items-start gap-6 group cursor-pointer" onClick={() => window.open(`https://wa.me/${content.supportwhatsapp}`, '_blank')}>
                  <div className="bg-white/10 p-4 rounded-2xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all"><MessageCircle size={32} /></div>
                  <div>
                    <h5 className="font-black text-xl mb-1 tracking-tight">WhatsApp de Suporte</h5>
                    <p className="text-gray-400 font-bold text-lg">{content.supportwhatsapp || "(33) 99987-2505"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-6">
                  <div className="bg-white/10 p-4 rounded-2xl text-brand-orange"><Mail size={32} /></div>
                  <div>
                    <h5 className="font-black text-xl mb-1 tracking-tight">E-mail Institucional</h5>
                    <p className="text-gray-400 font-bold text-lg">{content.supportemail || "contato@metodoprotagonizar.com.br"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="bg-white/10 p-4 rounded-2xl text-brand-orange"><Clock size={32} /></div>
                  <div>
                    <h5 className="font-black text-xl mb-1 tracking-tight">Horário de Atendimento</h5>
                    <p className="text-gray-400 font-bold">Segunda a Sexta: 08h às 18h</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-10 border-t border-white/5 flex gap-6">
                <a href="#" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-brand-pink transition-all"><Instagram size={28} /></a>
                <a href="#" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-brand-purple transition-all"><Heart size={28} /></a>
              </div>
            </div>

            <div className="bg-brand-cream border-2 border-brand-orange/10 p-12 rounded-[4rem] shadow-sm">
               <div className="flex items-center gap-4 text-brand-orange mb-6">
                 <MapPin size={32} />
                 <h4 className="text-2xl font-black text-brand-dark uppercase tracking-tight">Sede Administrativa</h4>
               </div>
               <p className="text-gray-500 font-bold leading-relaxed">
                 Lax Serviços Educacionais<br/>
                 Minas Gerais, Brasil
               </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .contact-input { width: 100%; padding: 1.25rem 1.5rem; background-color: #F8FAFC; border-radius: 1.5rem; border: 2px solid transparent; font-weight: 700; color: #1E1B4B; outline: none; transition: all 0.2s; }
        .contact-input:focus { border-color: #F97316; background-color: #FFFFFF; }
      `}</style>
    </div>
  );
};
