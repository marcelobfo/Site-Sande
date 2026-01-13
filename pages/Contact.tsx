
import React, { useState } from 'react';
import { Send, Phone, Mail, Clock, Instagram, MessageCircle, Heart, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { SiteContent } from '../types';
import { supabase } from '../lib/supabase';

interface ContactProps {
  content: SiteContent;
}

export const Contact: React.FC<ContactProps> = ({ content }) => {
  const [submitted, setSubmitted] = useState(false);
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
      const { error } = await supabase
        .from('leads')
        .insert([{ 
          ...formData, 
          status: 'Novo', 
          created_at: new Date().toISOString() 
        }]);

      if (error) throw error;
      setSubmitted(true);
      setFormData({ name: '', email: '', whatsapp: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error submitting lead:', err);
      alert('Erro ao enviar mensagem. Por favor, tente novamente ou use o WhatsApp.');
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
            {submitted ? (
              <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="bg-green-100 text-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg">
                  <CheckCircle2 size={56} />
                </div>
                <h2 className="text-4xl font-black text-brand-dark mb-4">Mensagem Enviada!</h2>
                <p className="text-gray-500 font-bold text-lg mb-10">Obrigado por entrar em contato. Responderemos o mais breve possível.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="bg-brand-purple text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                >
                  ENVIAR OUTRA MENSAGEM
                </button>
              </div>
            ) : (
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
            )}
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
