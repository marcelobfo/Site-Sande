
import React from 'react';
import { GraduationCap, Instagram, Facebook, Youtube, Mail, Phone, Send, ShieldCheck, Lock } from 'lucide-react';
import { View, SiteContent } from '../types';

interface FooterProps {
  onNavigate: (view: View) => void;
  content: SiteContent;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, content }) => {
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
              <li><button onClick={() => onNavigate('policies')} className="hover:text-white hover:translate-x-2 transition-all flex items-center gap-2">Garantia de 7 Dias</button></li>
              <li><button className="hover:text-white hover:translate-x-2 transition-all">Políticas de Devolução</button></li>
              <li><button className="hover:text-white hover:translate-x-2 transition-all">Privacidade</button></li>
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
            <div className="relative">
              <input placeholder="seu@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand-orange font-bold text-sm" />
              <button className="absolute right-2 top-2 bg-brand-orange p-2.5 rounded-xl text-white shadow-lg"><Send size={18} /></button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs font-black text-gray-500">
              <Phone size={16} /> {content.supportwhatsapp}
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest text-center">
            Copyright © 2026 Professora Sande Almeida. Todos os direitos reservados.
          </p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <button className="hover:text-white">Termos de Uso</button>
            <button className="hover:text-white">Suporte</button>
            <button className="hover:text-white">Privacidade</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
