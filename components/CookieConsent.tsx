
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, ArrowRight, Settings, Check, Lock, BarChart3, Target } from 'lucide-react';
import { View } from '../types';

interface CookieConsentProps {
  onNavigate: (view: View) => void;
}

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true
    analytics: true,
    marketing: true
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent-protagonista');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    localStorage.setItem('cookie-consent-protagonista', JSON.stringify(allAccepted));
    setIsVisible(false);
    setIsSettingsOpen(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent-protagonista', JSON.stringify(preferences));
    setIsVisible(false);
    setIsSettingsOpen(false);
  };

  if (!isVisible && !isSettingsOpen) return null;

  return (
    <>
      {/* Mini Banner de Consentimento */}
      {isVisible && !isSettingsOpen && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-700">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-brand-lilac/20 p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-purple/10 p-3 rounded-2xl text-brand-purple">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-brand-dark uppercase tracking-tighter">Privacidade</h4>
                  <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest leading-none">Cookies & Segurança</p>
                </div>
              </div>

              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                Utilizamos cookies para personalizar sua experiência, analisar o tráfego e garantir que você tenha o melhor do <span className="text-brand-purple font-black">Método Protagonizar</span>.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleAcceptAll}
                  className="w-full bg-brand-purple text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 hover:bg-brand-dark hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  ACEITAR TUDO <ArrowRight size={16} />
                </button>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => onNavigate('policies')}
                    className="flex-grow bg-gray-50 text-gray-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-lilac/10 hover:text-brand-purple transition-all border border-transparent hover:border-brand-lilac/20"
                  >
                    Políticas
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-6 bg-white text-gray-300 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-brand-dark transition-all border border-gray-100"
                  >
                    Configurar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações Detalhadas */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 lg:p-12 border-b bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-brand-purple text-white p-3 rounded-2xl">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Preferências</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Controle sua privacidade</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={24} className="text-gray-300" />
              </button>
            </div>

            <div className="p-10 lg:p-12 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Essenciais */}
              <div className="flex items-start gap-6 p-6 rounded-3xl bg-gray-50/50 border border-gray-100">
                <div className="bg-white p-3 rounded-xl text-brand-purple shadow-sm">
                  <Lock size={20} />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-black text-brand-dark uppercase text-xs">Cookies Essenciais</h5>
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-purple bg-brand-lilac/10 px-2 py-1 rounded-md">Obrigatório</span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Necessários para o funcionamento básico do site e segurança das suas informações.</p>
                </div>
                <div className="w-12 h-6 bg-brand-purple rounded-full relative flex items-center px-1 opacity-50 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full translate-x-6"></div>
                </div>
              </div>

              {/* Analíticos */}
              <div className="flex items-start gap-6 p-6 rounded-3xl bg-white border border-gray-100 hover:border-brand-purple/20 transition-all">
                <div className="bg-brand-lilac/10 p-3 rounded-xl text-brand-purple">
                  <BarChart3 size={20} />
                </div>
                <div className="flex-grow">
                  <h5 className="font-black text-brand-dark uppercase text-xs mb-1">Cookies Analíticos</h5>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Nos ajudam a entender como você interage com o site para podermos melhorar o conteúdo.</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${preferences.analytics ? 'bg-brand-purple' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.analytics ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start gap-6 p-6 rounded-3xl bg-white border border-gray-100 hover:border-brand-purple/20 transition-all">
                <div className="bg-brand-orange/10 p-3 rounded-xl text-brand-orange">
                  <Target size={20} />
                </div>
                <div className="flex-grow">
                  <h5 className="font-black text-brand-dark uppercase text-xs mb-1">Cookies de Marketing</h5>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">Permitem oferecer ofertas personalizadas do Método Protagonizar baseadas nos seus interesses.</p>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                  className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${preferences.marketing ? 'bg-brand-purple' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences.marketing ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            <div className="p-10 lg:p-12 bg-gray-50/50 border-t flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAcceptAll}
                className="flex-grow bg-white text-brand-dark border-2 border-brand-lilac/20 py-5 rounded-2xl font-black text-sm hover:border-brand-purple transition-all"
              >
                ACEITAR TODOS
              </button>
              <button 
                onClick={handleSavePreferences}
                className="flex-grow bg-brand-purple text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
              >
                SALVAR MINHA ESCOLHA <Check size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </>
  );
};
