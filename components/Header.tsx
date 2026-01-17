
import React, { useState } from 'react';
import { Menu, X, GraduationCap, ArrowRight, User, LogOut, Package } from 'lucide-react';
import { View, SiteContent } from '../types';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
  content: SiteContent;
  user?: any;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, content, user, isAdmin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navItems = [
    { label: 'Início', id: 'home' },
    { label: 'Sobre', id: 'about' },
    { label: 'Produtos', id: 'products' },
    { label: 'Blog', id: 'blog' },
    { label: 'Contato', id: 'contact' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-brand-lilac/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            {content.logourl ? (
              <img src={content.logourl} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-purple p-2.5 rounded-2xl text-white group-hover:rotate-12 transition-transform shadow-lg shadow-purple-100">
                  <GraduationCap size={26} />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-black text-brand-dark leading-none uppercase">Sande Almeida</h1>
                  <p className="text-[9px] uppercase tracking-widest text-brand-orange font-bold mt-1">Método Protagonizar</p>
                </div>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as View)}
                className={`text-sm font-black tracking-tight transition-all relative py-2 ${
                  currentView === item.id 
                  ? 'text-brand-purple' 
                  : 'text-gray-400 hover:text-brand-dark'
                }`}
              >
                {item.label}
                {currentView === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-orange rounded-full"></span>
                )}
              </button>
            ))}

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 bg-brand-cream px-5 py-2.5 rounded-2xl border border-brand-lilac/30 hover:bg-brand-lilac/10 transition-all"
                >
                  <div className="w-8 h-8 bg-brand-purple text-white rounded-full flex items-center justify-center font-black text-xs">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black uppercase text-brand-dark tracking-widest">Minha Conta</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-3xl border border-brand-lilac/20 p-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    {isAdmin && (
                      <button 
                        onClick={() => { onNavigate('admin'); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-brand-purple/5 text-brand-purple font-black text-xs uppercase tracking-widest"
                      >
                        <GraduationCap size={18} /> Sistema Admin
                      </button>
                    )}
                    <button 
                      onClick={() => { onNavigate('my-account'); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-brand-orange/5 text-brand-dark font-black text-xs uppercase tracking-widest"
                    >
                      <Package size={18} /> Meus Materiais
                    </button>
                    <div className="h-px bg-gray-100 my-2 mx-4"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest"
                    >
                      <LogOut size={18} /> Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className="bg-brand-purple text-white px-7 py-3 rounded-2xl text-sm font-black shadow-xl shadow-purple-200 hover:bg-brand-dark hover:scale-105 transition-all flex items-center gap-2"
              >
                ENTRAR / CADASTRAR <ArrowRight size={16} />
              </button>
            )}
          </nav>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-brand-purple p-2">
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-lilac/30 animate-in slide-in-from-top duration-300">
          <div className="px-6 py-10 space-y-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as View);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left text-2xl font-black ${
                  currentView === item.id ? 'text-brand-purple' : 'text-gray-400'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <button 
                onClick={() => { onNavigate('my-account'); setIsMenuOpen(false); }}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-xl shadow-2xl"
              >
                Meus Materiais
              </button>
            ) : (
              <button 
                onClick={() => { onNavigate('login'); setIsMenuOpen(false); }}
                className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-xl shadow-2xl"
              >
                Acessar Portal
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
