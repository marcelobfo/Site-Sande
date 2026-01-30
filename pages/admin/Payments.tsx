
import React, { useState } from 'react';
import { CreditCard, Link as LinkIcon, RefreshCcw, ShieldCheck, Terminal, ShieldAlert, Copy, UserPlus, Loader2 } from 'lucide-react';
import { SiteContent } from '../../types';
import { Section, AdminInput } from '../../components/admin/AdminShared';
import { NotificationType } from '../../components/Notification';
import { supabase } from '../../lib/supabase';

interface AdminPaymentsProps {
  form: SiteContent;
  setForm: (form: SiteContent) => void;
  notify: (type: NotificationType, title: string, message: string) => void;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ form, setForm, notify }) => {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const handleAddAdmin = async () => {
    if (!newAdminEmail) return notify('warning', 'Atenção', 'Digite o e-mail do usuário.');
    
    setLoadingAdmin(true);
    try {
      // Chama a função RPC segura do banco de dados
      const { error } = await supabase.rpc('set_admin_role', { 
        target_email: newAdminEmail, 
        is_admin: true 
      });

      if (error) throw error;

      notify('success', 'Admin Adicionado', `O usuário ${newAdminEmail} agora é um Super Admin.`);
      setNewAdminEmail('');
    } catch (err: any) {
      notify('error', 'Erro ao promover', err.message || 'Verifique se o e-mail está cadastrado.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <Section title="Gateway Asaas" icon={<CreditCard />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
           <AdminInput label="Backend URL (n8n)" icon={<LinkIcon size={16}/>} value={form.asaas_backend_url} onChange={(v: string) => setForm({...form, asaas_backend_url: v})} placeholder="https://..." />
           <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between shadow-inner">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ambiente Ativo</p>
                <p className={`font-black text-xs uppercase ${form.asaas_use_sandbox ? 'text-brand-orange' : 'text-green-500'} flex items-center gap-2`}>
                  {form.asaas_use_sandbox ? <><RefreshCcw size={12} className="animate-spin-slow"/> Sandbox</> : <><ShieldCheck size={12}/> Produção</>}
                </p>
              </div>
              <button onClick={() => setForm({...form, asaas_use_sandbox: !form.asaas_use_sandbox})} className={`w-14 h-8 rounded-full relative transition-all shadow-md ${form.asaas_use_sandbox ? 'bg-brand-orange' : 'bg-green-500'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${form.asaas_use_sandbox ? 'right-1' : 'left-1'}`}></div>
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className={`p-8 rounded-[3rem] border-2 transition-all ${!form.asaas_use_sandbox ? 'border-brand-purple bg-brand-purple/5 shadow-xl' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-brand-purple">
                  <ShieldCheck size={16} /> Produção (API Key)
                </h5>
                {!form.asaas_use_sandbox && <span className="bg-green-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black">ATIVO</span>}
              </div>
              <p className="text-[10px] text-gray-400 mb-4 font-bold">URL: https://api.asaas.com/</p>
              <AdminInput type="password" placeholder="Chave de Produção..." value={form.asaas_production_key} onChange={(v: string) => setForm({...form, asaas_production_key: v})} />
           </div>

           <div className={`p-8 rounded-[3rem] border-2 transition-all ${form.asaas_use_sandbox ? 'border-brand-orange bg-brand-orange/5 shadow-xl' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-brand-orange">
                  <Terminal size={16} /> Sandbox (API Key)
                </h5>
                {form.asaas_use_sandbox && <span className="bg-brand-orange text-white text-[8px] px-2 py-0.5 rounded-full font-black">ATIVO</span>}
              </div>
              <p className="text-[10px] text-gray-400 mb-4 font-bold">URL: https://api-sandbox.asaas.com/</p>
              <AdminInput type="password" placeholder="Chave de Sandbox..." value={form.asaas_sandbox_key} onChange={(v: string) => setForm({...form, asaas_sandbox_key: v})} />
           </div>
        </div>
      </Section>

      <Section title="Controle de Acesso (Admins)" icon={<ShieldAlert />}>
         <div className="bg-brand-dark p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-32 -mr-32 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
               <div className="md:w-1/2 space-y-4">
                  <h4 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                    <UserPlus className="text-brand-orange" /> Adicionar Super Admin
                  </h4>
                  <p className="text-gray-400 font-medium text-sm leading-relaxed">
                    Transforme um usuário já cadastrado em um Super Administrador. Ele terá acesso total a este painel.
                  </p>
               </div>
               <div className="md:w-1/2 w-full bg-white/10 p-2 rounded-2xl flex gap-2 border border-white/10">
                  <input 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="E-mail do usuário..." 
                    className="bg-transparent text-white placeholder-gray-400 font-bold px-4 w-full outline-none"
                  />
                  <button 
                    onClick={handleAddAdmin}
                    disabled={loadingAdmin}
                    className="bg-brand-orange hover:bg-white hover:text-brand-orange text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 flex items-center gap-2"
                  >
                    {loadingAdmin ? <Loader2 className="animate-spin" size={16} /> : 'Promover'}
                  </button>
               </div>
            </div>
         </div>
      </Section>
    </div>
  );
};
