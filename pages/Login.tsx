
import React, { useState } from 'react';
import { Mail, Lock, Loader2, GraduationCap, UserPlus, LogIn } from 'lucide-react';
import { View } from '../types';
import { supabase } from '../lib/supabase';
import { NotificationType } from '../components/Notification';

interface LoginProps {
  onNavigate: (view: View) => void;
  type?: 'admin' | 'user';
  notify: (type: NotificationType, title: string, message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, type = 'user', notify }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        notify('success', 'Cadastro Iniciado', 'Verifique seu e-mail para confirmar a conta.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        const user = data.user;
        const isAdmin = user?.user_metadata?.role === 'admin' || user?.email === 'contato@metodoprotagonizar.com.br';

        notify('success', 'Bem-vinda!', 'Acesso autorizado com sucesso.');
        
        if (isAdmin) {
          onNavigate('admin');
        } else {
          onNavigate('my-account');
        }
      }
    } catch (err: any) {
      notify('error', 'Falha na Autenticação', err.message || "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-brand-cream/30">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-3xl overflow-hidden border border-brand-lilac/20">
        <div className="bg-brand-purple p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 skew-y-6"></div>
          <GraduationCap size={48} className="mx-auto mb-4 text-brand-orange" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {type === 'admin' ? 'Acesso Restrito' : 'Área de Membros'}
          </h1>
          <p className="text-purple-100 font-medium text-sm mt-2">
            {isRegister ? 'Crie sua conta protagonista' : 'Acesse seus materiais exclusivos'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="p-10 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Seu E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-purple rounded-2xl font-bold text-brand-dark transition-all outline-none shadow-inner" 
                  placeholder="exemplo@email.com" 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-purple rounded-2xl font-bold text-brand-dark transition-all outline-none shadow-inner" 
                  placeholder="••••••••" 
                />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : isRegister ? <><UserPlus /> CADASTRAR AGORA</> : <><LogIn /> ENTRAR NO PORTAL</>}
          </button>

          {type !== 'admin' && (
            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-brand-purple font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                {isRegister ? 'Já tenho uma conta? Entrar' : 'Não tem conta? Cadastre-se com o e-mail de compra'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
