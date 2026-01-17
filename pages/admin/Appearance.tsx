
import React from 'react';
import { Palette, MessageCircle, Phone, Mail, BarChart, Globe, MousePointer2 } from 'lucide-react';
import { SiteContent } from '../../types';
import { Section, AdminInput, ImageUp } from '../../components/admin/AdminShared';

interface AdminAppearanceProps {
  form: SiteContent;
  setForm: (form: SiteContent) => void;
  onImageUpload: (e: any, field: string) => void;
}

export const AdminAppearance: React.FC<AdminAppearanceProps> = ({ form, setForm, onImageUpload }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <Section title="Identidade Visual & Branding" icon={<Palette />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <ImageUp label="Logo Oficial (Cabeçalho)" current={form.logourl} onUpload={(e: any) => onImageUpload(e, 'logourl')} />
           <ImageUp label="Favicon (Navegador)" current={form.faviconurl} onUpload={(e: any) => onImageUpload(e, 'faviconurl')} />
        </div>
      </Section>

      <Section title="Contatos de Suporte" icon={<MessageCircle />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminInput label="WhatsApp Suporte" icon={<Phone size={16}/>} value={form.supportwhatsapp} onChange={(v: string) => setForm({...form, supportwhatsapp: v})} />
          <AdminInput label="E-mail Suporte" icon={<Mail size={16}/>} value={form.supportemail} onChange={(v: string) => setForm({...form, supportemail: v})} />
        </div>
      </Section>

      <Section title="Métricas & Conversão" icon={<BarChart />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AdminInput label="Google Analytics ID" icon={<Globe size={16}/>} value={form.google_analytics_id} onChange={(v: string) => setForm({...form, google_analytics_id: v})} />
          <AdminInput label="Meta Pixel ID" icon={<MousePointer2 size={16}/>} value={form.meta_pixel_id} onChange={(v: string) => setForm({...form, meta_pixel_id: v})} />
          <div className="col-span-1 md:col-span-2">
            <AdminInput label="Token API Meta" textarea value={form.meta_api_token} onChange={(v: string) => setForm({...form, meta_api_token: v})} />
          </div>
        </div>
      </Section>
    </div>
  );
};
