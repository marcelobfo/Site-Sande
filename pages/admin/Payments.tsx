import React from 'react';
import { CreditCard, Link as LinkIcon, RefreshCcw, ShieldCheck, Terminal, ShieldAlert, Copy } from 'lucide-react';
import { SiteContent } from '../../types';
import { Section, AdminInput } from '../../components/admin/AdminShared';
import { NotificationType } from '../../components/Notification';

interface AdminPaymentsProps {
  form: SiteContent;
  setForm: (form: SiteContent) => void;
  notify: (type: NotificationType, title: string, message: string) => void;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = ({ form, setForm, notify }) => {
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

      <div className="bg-brand-dark p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-3xl">
         <div className="flex items-center gap-6">
            <div className="bg-brand-orange p-5 rounded-3xl shadow-xl animate-pulse"><ShieldAlert size={32} /></div>
            <div>
               <h4 className="text-2xl font-black uppercase tracking-tight">Privilégios Admin</h4>
               <p className="text-brand-lilac font-medium opacity-80">Comando para promover usuário via Supabase SQL.</p>
            </div>
         </div>
         <button onClick={() => { navigator.clipboard.writeText("UPDATE auth.users SET raw_user_meta_data = '{\"role\": \"admin\"}' WHERE email = 'EMAIL_AQUI';"); notify('success', 'Comando Copiado', 'Execute o SQL no painel do Supabase.'); }} className="bg-white/10 hover:bg-white/20 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10 flex items-center gap-3">
           <Copy size={16} /> COPIAR SQL
         </button>
      </div>
    </div>
  );
};