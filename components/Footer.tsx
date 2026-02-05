
import React, { useState } from 'react';
import { GraduationCap, Instagram, Facebook, Youtube, Mail, Phone, Send, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { View, SiteContent } from '../types';
import { supabase } from '../lib/supabase';

interface FooterProps {
  onNavigate: (view: View) => void;
  content: SiteContent;
}

const WEBHOOK_URL = 'https://atendimento-creditar-n8n.stpanz.easypanel.host/webhook/briefing';

export const Footer: React.FC<FooterProps> = ({ onNavigate, content }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      // 1. Salvar Lead no Supabase
      const { error } = await supabase.from('leads').insert([{
        email,
        name: 'Assinante Newsletter',
        subject: 'Newsletter',
        message: 'Inscrição via Rodapé',
        status: 'Novo',
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      // 2. Enviar Webhook
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          origin: 'Newsletter Rodapé',
          subject: 'Inscrição Newsletter',
          sent_at: new Date().toISOString()
        })
      });

      alert('Inscrição realizada com sucesso! Em breve você receberá novidades.');
      setEmail('');
    } catch (err) {
      console.error('Erro ao inscrever:', err);
      alert('Erro ao realizar inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-brand-dark text-white pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange via-brand-purple to-brand-orange"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-brand-orange p-2 rounded-xl text-white">
                <GraduationCap size={32} />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">SANDE ALMEIDA</span>
            </div>
            <p className="text-gray-400 font-medium leading-relaxed mb-8">
              O Método Protagonizar nasceu para dar vida à criatividade do professor. Combina metodologias ativas, planejamento inteligente e inovação acessível.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-orange transition-all"><Instagram size={22} /></a>
              <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-purple transition-all"><Facebook size={22} /></a>
              <a href="#" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500 transition-all"><Youtube size={22} /></a>
            </div>
          </div>

          <div>
            <h3 className="font-black text-xl mb-8 text-brand-orange tracking-tight uppercase">Explorar</h3>
            <ul className="space-y-4 text-gray-400 font-bold">
              <li><button onClick={() => onNavigate('home')} className="hover:text-white hover:translate-x-2 transition-all">Início</button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-white hover:translate-x-2 transition-all">Sobre a Empresa</button></li>
              <li><button onClick={() => onNavigate('products')} className="hover:text-white hover:translate-x-2 transition-all">Loja de Materiais</button></li>
              <li><button onClick={() => onNavigate('blog')} className="hover:text-white hover:translate-x-2 transition-all">Nosso Blog</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-white hover:translate-x-2 transition-all">Fale Conosco</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-xl mb-8 text-brand-orange tracking-tight uppercase">Institucional</h3>
            <ul className="space-y-4 text-gray-400 font-bold">
              <li><button onClick={() => onNavigate('faq')} className="hover:text-white hover:translate-x-2 transition-all flex items-center gap-2">Perguntas Frequentes (FAQ)</button></li>
              <li><button onClick={() => onNavigate('refund')} className="hover:text-white hover:translate-x-2 transition-all flex items-center gap-2">Garantia de 7 Dias</button></li>
              <li><button onClick={() => onNavigate('refund')} className="hover:text-white hover:translate-x-2 transition-all">Políticas de Devolução</button></li>
              <li><button onClick={() => onNavigate('privacy')} className="hover:text-white hover:translate-x-2 transition-all">Privacidade</button></li>
              <li>
                <button 
                  onClick={() => onNavigate('admin')} 
                  className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-[10px] text-white/50 hover:text-white flex items-center gap-2 transition-all"
                >
                  <Lock size={12} /> SISTEMA INTERNO
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-black text-xl mb-8 text-brand-orange tracking-tight uppercase">Novidades</h3>
            <p className="text-gray-400 font-bold mb-6 text-sm">Deixe seu melhor e-mail e venha protagonizar!</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-orange font-bold text-sm text-white placeholder-gray-500" 
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bg-brand-orange p-2.5 rounded-xl text-white shadow-lg disabled:opacity-50 hover:bg-white hover:text-brand-orange transition-all"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
            <div className="mt-8 flex items-center gap-4 text-xs font-black text-gray-500">
              <Phone size={16} /> {content.supportwhatsapp}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest text-center md:text-left">
              Copyright © 2026 Professora Sande Almeida. Todos os direitos reservados.
            </p>
            <a href="https://technedigital.com.br" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-brand-purple hover:text-white transition-colors">
              Construído por Techne Digital
            </a>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <button onClick={() => onNavigate('privacy')} className="hover:text-white">Termos de Uso</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white">Suporte</button>
            <button onClick={() => onNavigate('privacy')} className="hover:text-white">Privacidade</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
