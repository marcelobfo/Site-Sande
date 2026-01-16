
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Home as HomeIcon, DollarSign, 
  CreditCard, Users, LayoutDashboard, Trash2, Plus, 
  Upload, Image as ImageIcon, FileText, Info, Edit3, X, Loader2, ShoppingCart, Palette, Globe, AlertTriangle,
  Eye, MessageSquare, MessageCircle, Mail, Calendar, GripVertical, Phone, Gem, ExternalLink, Image, Copy, Database,
  Lightbulb, List, LayoutGrid, CheckCircle2, ChevronRight, ShieldCheck, RefreshCcw, Server, Terminal, Check, Wifi, WifiOff
} from 'lucide-react';
import { SiteContent, Lead, LeadStatus, Product, BlogPost } from '../types';
import { supabase } from '../lib/supabase';

interface AdminProps {
  content: SiteContent;
  onUpdate: (content: SiteContent) => Promise<void>;
}

type Tab = 'leads' | 'content_home' | 'content_about' | 'manage_store' | 'manage_blog' | 'settings' | 'payments';

const STATUS_OPTIONS: LeadStatus[] = ['Novo', 'Em Contato', 'Negociação', 'Fechado', 'Perdido'];

export const Admin: React.FC<AdminProps> = ({ content, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [form, setForm] = useState<SiteContent>(content);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchLeads();
    fetchProducts();
    fetchBlog();
    setForm(content);
  }, [content]);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchBlog = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('publish_date', { ascending: false });
    if (data) setPosts(data);
  };

  const handleSaveContent = async () => {
    setSavingSettings(true);
    setErrorMessage(null);
    try {
      await onUpdate(form);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar');
    } finally {
      setSavingSettings(false);
    }
  };

  const testConnection = async () => {
    if (!form.asaas_backend_url) {
      setTestResult({ success: false, message: "Insira uma URL primeiro." });
      return;
    }

    setTestingEndpoint(true);
    setTestResult(null);

    try {
      const response = await fetch(form.asaas_backend_url, {
        method: 'OPTIONS', // Testa CORS e presença do endpoint
      }).catch(e => { throw new Error("Falha na conexão (Possível erro de CORS ou servidor offline)"); });

      setTestResult({ 
        success: true, 
        message: "Endpoint respondeu! (CORS Verificado)" 
      });
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: err.message || "Erro desconhecido ao testar." 
      });
    } finally {
      setTestingEndpoint(false);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (confirm("Deseja realmente excluir este item?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir");
        return;
      }
      if (table === 'products') fetchProducts();
      else if (table === 'blog_posts') fetchBlog();
      else if (table === 'leads') {
        fetchLeads();
        setIsLeadDetailOpen(false);
      }
    }
  };

  const resetCookieConsent = () => {
    if (confirm("Deseja resetar o banner de cookies para você? (Isso limpará sua preferência local)")) {
      localStorage.removeItem('cookie-consent-protagonista');
      window.location.reload();
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const saveFormItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const table = activeTab === 'manage_store' ? 'products' : 'blog_posts';
    
    try {
      if (editItem.id) {
        await supabase.from(table).update(editItem).eq('id', editItem.id);
      } else {
        await supabase.from(table).insert([editItem]);
      }
      if (table === 'products') fetchProducts(); else fetchBlog();
      setIsModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, target: 'site' | 'modal') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'site') setForm(prev => ({ ...prev, [field]: reader.result as string }));
        else setEditItem((prev: any) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const copySql = () => {
    const sql = `ALTER TABLE site_content 
ADD COLUMN IF NOT EXISTS asaas_production_key TEXT,
ADD COLUMN IF NOT EXISTS asaas_sandbox_key TEXT,
ADD COLUMN IF NOT EXISTS asaas_use_sandbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS asaas_backend_url TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage1 TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage2 TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage3 TEXT;

-- Resetar cache do PostgREST
NOTIFY pgrst, 'reload schema';`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SidebarItem = ({ id, icon, label }: { id: Tab, icon: React.ReactNode, label: string }) => (
    <button onClick={() => { setActiveTab(id); setErrorMessage(null); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === id ? 'bg-brand-purple text-white shadow-xl' : 'text-gray-400 hover:bg-brand-lilac/10'}`}>
      <div className="shrink-0">{icon}</div>
      <span className={`whitespace-nowrap transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>{label}</span>
    </button>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex max-w-full overflow-hidden">
      <aside onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)} className={`bg-white border-r p-6 flex flex-col transition-all duration-300 h-screen sticky top-0 z-40 shrink-0 ${isSidebarExpanded ? 'w-72' : 'w-24'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-brand-dark p-2.5 rounded-xl text-white"><Settings size={24} /></div>
          <h2 className={`font-black text-xl transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>PAINEL</h2>
        </div>
        <nav className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
          <SidebarItem id="leads" icon={<Users size={20} />} label="Leads (CRM)" />
          <SidebarItem id="manage_store" icon={<Gem size={20} />} label="Vitrine de Materiais" />
          <SidebarItem id="manage_blog" icon={<FileText size={20} />} label="Conteúdo Blog" />
          <div className="h-px bg-gray-100 my-4"></div>
          <SidebarItem id="content_home" icon={<HomeIcon size={20} />} label="Home & Clube" />
          <SidebarItem id="content_about" icon={<Info size={20} />} label="Sobre & Contato" />
          <SidebarItem id="settings" icon={<Palette size={20} />} label="Aparência" />
          <SidebarItem id="payments" icon={<CreditCard size={20} />} label="Pagamentos Asaas" />
        </nav>
      </aside>

      <div className="flex-grow p-8 lg:p-12 overflow-y-auto max-w-full overflow-x-hidden">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">
            {activeTab === 'leads' ? 'Kanban de Leads' : 
             activeTab === 'manage_store' ? 'Gerenciar Vitrine' :
             activeTab === 'manage_blog' ? 'Gerenciar Blog' :
             activeTab === 'settings' ? 'Aparência do Site' : 
             activeTab === 'payments' ? 'Configurações de Pagamento' : 'Configurações'}
          </h1>
          <div className="flex gap-4">
            {['content_home', 'content_about', 'settings', 'payments'].includes(activeTab) && (
              <button onClick={handleSaveContent} disabled={savingSettings} className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2">
                {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SALVAR
              </button>
            )}
            {(activeTab === 'manage_store' || activeTab === 'manage_blog') && (
              <button onClick={() => { setEditItem({}); setIsModalOpen(true); }} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2">
                <Plus size={20} /> ADICIONAR NOVO
              </button>
            )}
          </div>
        </header>

        {showSuccess && <div className="bg-green-500 text-white p-6 rounded-2xl font-black mb-8 animate-in slide-in-from-top flex items-center gap-3"><CheckCircle2 /> Alterações salvas com sucesso!</div>}
        {errorMessage && <div className="bg-red-500 text-white p-6 rounded-2xl font-black mb-8 flex items-center gap-3"><AlertTriangle /> {errorMessage}</div>}

        {activeTab === 'leads' && (
          <div className="flex gap-6 overflow-x-auto pb-6 min-h-[70vh] custom-scrollbar-h">
            {STATUS_OPTIONS.map(status => (
              <div key={status} className="bg-gray-100/30 p-6 rounded-[2.5rem] min-w-[320px] flex flex-col border-2 border-dashed border-transparent">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h4 className="font-black text-[11px] uppercase text-gray-400 tracking-widest">{status}</h4>
                  <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-brand-purple shadow-sm">{leads.filter(l => l.status === status).length}</span>
                </div>
                <div className="space-y-4">
                  {leads.filter(l => l.status === status).map(lead => (
                    <div key={lead.id} onClick={() => { setSelectedLead(lead); setIsLeadDetailOpen(true); }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl transition-all group">
                      <p className="font-black text-brand-dark mb-1 truncate">{lead.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{lead.subject}</p>
                      <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-[9px] text-gray-300 font-bold">{new Date(lead.created_at).toLocaleDateString()}</span>
                        <Eye size={14} className="text-brand-purple opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Identidade Visual" icon={<Palette className="text-brand-purple"/>}>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <ImageUp label="Logo do Cabeçalho" current={form.logourl} onUpload={e => handleImageUpload(e, 'logourl', 'site')} />
                  <ImageUp label="Favicon (32x32)" current={form.faviconurl} onUpload={e => handleImageUpload(e, 'faviconurl', 'site')} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <AdminInput label="WhatsApp (DDI+DDD+Número)" value={form.supportwhatsapp} onChange={v => setForm({...form, supportwhatsapp: v})} />
                  <AdminInput label="E-mail de Suporte" value={form.supportemail} onChange={v => setForm({...form, supportemail: v})} />
                </div>
              </div>
            </Section>

            <Section title="Privacidade e Cookies" icon={<ShieldCheck className="text-brand-orange"/>}>
              <div className="p-8 bg-brand-cream/30 border border-brand-orange/10 rounded-3xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-brand-orange shadow-sm">
                    <RefreshCcw size={24} />
                  </div>
                  <div>
                    <h5 className="font-black text-brand-dark uppercase text-xs">Resetar Consentimento</h5>
                    <p className="text-xs text-gray-400 font-medium">Força a exibição do banner de cookies novamente (apenas local).</p>
                  </div>
                </div>
                <button 
                  onClick={resetCookieConsent}
                  className="w-full sm:w-auto bg-brand-orange text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-all"
                >
                  TESTAR BANNER AGORA
                </button>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Integração Bancária Asaas" icon={<CreditCard className="text-brand-purple"/>}>
              <div className="space-y-8">
                <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                  <div className="text-xs font-medium text-amber-700 leading-relaxed">
                    <strong className="block mb-2 uppercase tracking-widest">Atenção sobre CORS:</strong>
                    Devido às restrições de segurança do navegador, você **NÃO** deve fazer requisições diretas do site para a API do Asaas. 
                    Utilize o campo **Backend URL** abaixo para apontar para seu Webhook do n8n ou servidor proxy que fará a ponte segura.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AdminInput label="API Key Produção ($aact...)" type="password" value={form.asaas_production_key} onChange={v => setForm({...form, asaas_production_key: v})} />
                  <AdminInput label="API Key Sandbox ($aact_hmlg...)" type="password" value={form.asaas_sandbox_key} onChange={v => setForm({...form, asaas_sandbox_key: v})} />
                </div>

                <div className="flex items-center gap-4 p-8 bg-brand-cream/50 border border-brand-orange/20 rounded-3xl">
                  <input type="checkbox" id="asaas_use_sandbox" checked={form.asaas_use_sandbox} onChange={e => setForm({...form, asaas_use_sandbox: e.target.checked})} className="w-8 h-8 rounded-lg accent-brand-purple cursor-pointer" />
                  <div>
                    <label htmlFor="asaas_use_sandbox" className="font-black text-brand-dark uppercase text-sm block cursor-pointer">Usar Ambiente Sandbox (Homologação)</label>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ative para testar sem cobrar valores reais.</p>
                  </div>
                </div>

                <div className="h-px bg-gray-100"></div>

                <Section title="Ponte Segura (Backend)" icon={<Server className="text-brand-orange" />}>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-grow">
                        <AdminInput label="URL do Webhook ou Proxy (n8n/Node/PHP)" placeholder="Ex: https://n8n.seuservidor.com/webhook/asaas" value={form.asaas_backend_url} onChange={v => setForm({...form, asaas_backend_url: v})} />
                      </div>
                      <button 
                        onClick={testConnection} 
                        disabled={testingEndpoint}
                        className={`px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 mb-0.5 ${testResult?.success ? 'bg-green-500 text-white' : testResult?.success === false ? 'bg-red-500 text-white' : 'bg-brand-dark text-white hover:bg-black'}`}
                      >
                        {testingEndpoint ? <Loader2 className="animate-spin" size={16} /> : testResult?.success ? <Wifi size={16}/> : <WifiOff size={16}/>}
                        TESTAR CONEXÃO
                      </button>
                    </div>
                    {testResult && (
                      <p className={`text-[10px] font-black uppercase px-4 py-2 rounded-lg inline-block ${testResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {testResult.message}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                      Se este campo estiver vazio, o checkout será redirecionado automaticamente para o **WhatsApp do Suporte** com os dados do cliente preenchidos.
                    </p>
                  </div>
                </Section>
                
                {/* DATABASE SYNC HELPER */}
                <div className="mt-12 bg-gray-900 rounded-[2.5rem] p-8 lg:p-10 text-white overflow-hidden relative border-t-8 border-brand-orange shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Terminal size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-brand-orange p-2 rounded-xl">
                        <Database size={20} />
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-widest">Database Sync (Supabase Fix)</h4>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-8 leading-relaxed">
                      Se você recebeu o erro <span className="text-white font-bold italic">PGRST204 (Column not found)</span>, copie o código abaixo e execute no **SQL Editor** do seu painel Supabase. Isso criará todas as colunas necessárias para o Asaas e para a Galeria de Imagens:
                    </p>
                    <div className="bg-black/50 p-6 rounded-2xl font-mono text-[11px] text-green-400 mb-6 border border-white/5 relative group">
                      <button 
                        onClick={copySql}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white transition-all flex items-center gap-2"
                      >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : 'Copiar Script'}
                      </button>
                      <pre className="whitespace-pre-wrap leading-relaxed">
{`ALTER TABLE site_content 
ADD COLUMN IF NOT EXISTS asaas_production_key TEXT,
ADD COLUMN IF NOT EXISTS asaas_sandbox_key TEXT,
ADD COLUMN IF NOT EXISTS asaas_use_sandbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS asaas_backend_url TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage1 TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage2 TEXT,
ADD COLUMN IF NOT EXISTS aboutfeaturedimage3 TEXT;

-- Forçar atualização do cache do Supabase
NOTIFY pgrst, 'reload schema';`}
                      </pre>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 p-4 rounded-xl border border-white/5">
                      💡 Após executar o SQL, aguarde 10 segundos e tente salvar suas alterações no painel administrativo novamente.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'manage_store' && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl w-fit shadow-sm">
              <button onClick={() => setProductViewMode('grid')} className={`p-2 rounded-xl ${productViewMode === 'grid' ? 'bg-brand-purple text-white' : 'text-gray-400'}`}><LayoutGrid size={20}/></button>
              <button onClick={() => setProductViewMode('list')} className={`p-2 rounded-xl ${productViewMode === 'list' ? 'bg-brand-purple text-white' : 'text-gray-400'}`}><List size={20}/></button>
            </div>
            
            <div className={productViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-8" : "space-y-4"}>
              {products.map(p => (
                <div key={p.id} className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex ${productViewMode === 'list' ? 'items-center gap-6' : 'flex-col gap-4'}`}>
                  <img src={p.image_url} className={productViewMode === 'list' ? "w-20 h-20 rounded-2xl object-cover" : "w-full aspect-square rounded-3xl object-cover"} alt="" />
                  <div className="flex-grow">
                    <h4 className="font-black text-brand-dark leading-tight">{p.title}</h4>
                    <p className="text-brand-purple font-black text-sm">R$ {Number(p.price).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(p); setIsModalOpen(true); }} className="p-3 bg-brand-lilac/20 text-brand-purple rounded-xl"><Edit3 size={16}/></button>
                    <button onClick={() => deleteItem('products', p.id)} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'manage_blog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                <img src={p.image_url} className="w-full aspect-video rounded-3xl object-cover" alt="" />
                <h4 className="font-black text-brand-dark leading-tight line-clamp-2 h-12">{p.title}</h4>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{p.category}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditItem(p); setIsModalOpen(true); }} className="p-2 bg-brand-lilac/20 text-brand-purple rounded-lg"><Edit3 size={14}/></button>
                    <button onClick={() => deleteItem('blog_posts', p.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'content_home' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Página Inicial (Hero)" icon={<HomeIcon className="text-brand-purple"/>}>
              <div className="space-y-6">
                <AdminInput label="Título Chamada" value={form.homeherotitle} onChange={v => setForm({...form, homeherotitle: v})} />
                <AdminInput label="Subtítulo Descritivo" textarea value={form.homeherosub} onChange={v => setForm({...form, homeherosub: v})} />
                <div className="grid grid-cols-2 gap-6">
                  <ImageUp label="Foto Principal Hero" current={form.homeheroimageurl} onUpload={e => handleImageUpload(e, 'homeheroimageurl', 'site')} />
                  <ImageUp label="Background Hero" current={form.homeherobgimageurl} onUpload={e => handleImageUpload(e, 'homeherobgimageurl', 'site')} />
                </div>
              </div>
            </Section>
            <Section title="Clube de Assinatura" icon={<Gem className="text-brand-orange"/>}>
              <div className="space-y-6">
                <AdminInput label="Nome do Clube" value={form.clubetitle} onChange={v => setForm({...form, clubetitle: v})} />
                <AdminInput label="Descrição Curta" textarea value={form.clubedescription} onChange={v => setForm({...form, clubedescription: v})} />
                <AdminInput label="Preço da Assinatura (R$)" type="number" value={form.clubeprice} onChange={v => setForm({...form, clubeprice: Number(v)})} />
                <ImageUp label="Banner do Clube" current={form.clubebannerimageurl} onUpload={e => handleImageUpload(e, 'clubebannerimageurl', 'site')} />
              </div>
            </Section>
          </div>
        )}

        {activeTab === 'content_about' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Página Sobre" icon={<Info size={20} className="text-brand-purple"/>}>
              <div className="space-y-6">
                <AdminInput label="Título da Seção" value={form.abouttitle} onChange={v => setForm({...form, abouttitle: v})} />
                <AdminInput label="História / Trajetória" textarea value={form.abouttext} onChange={v => setForm({...form, abouttext: v})} />
                <ImageUp label="Foto da Professora (Sobre)" current={form.abouttrajectoryimageurl} onUpload={e => handleImageUpload(e, 'abouttrajectoryimageurl', 'site')} />
              </div>
            </Section>
            <Section title="Galeria de Destaques" icon={<ImageIcon className="text-brand-pink"/>}>
              <div className="grid grid-cols-3 gap-4">
                <ImageUp label="Destaque 1" current={form.aboutfeaturedimage1} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage1', 'site')} />
                <ImageUp label="Destaque 2" current={form.aboutfeaturedimage2} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage2', 'site')} />
                <ImageUp label="Destaque 3" current={form.aboutfeaturedimage3} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage3', 'site')} />
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* LEAD DETAIL MODAL */}
      {isLeadDetailOpen && selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 lg:p-14 border-b flex justify-between items-start">
              <div>
                <h3 className="text-4xl lg:text-5xl font-black text-brand-dark tracking-tighter uppercase leading-none">{selectedLead.name}</h3>
                <p className="text-brand-purple font-black uppercase text-xs tracking-[0.2em] mt-3">{selectedLead.subject}</p>
              </div>
              <button 
                onClick={() => setIsLeadDetailOpen(false)} 
                className="w-16 h-16 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all shadow-sm group"
              >
                <X size={32} className="text-gray-300 group-hover:text-brand-dark transition-colors" />
              </button>
            </div>
            
            <div className="p-10 lg:p-14 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-brand-lilac/5 p-8 rounded-[2rem] border border-brand-lilac/10">
                  <label className="label-admin mb-3 block">E-mail de Contato</label>
                  <p className="font-black text-brand-dark text-lg break-all leading-none">{selectedLead.email}</p>
                </div>
                <div className="bg-brand-lilac/5 p-8 rounded-[2rem] border border-brand-lilac/10">
                  <label className="label-admin mb-3 block">WhatsApp / Telefone</label>
                  <p className="font-black text-brand-dark text-lg leading-none">{selectedLead.whatsapp || 'Não informado'}</p>
                </div>
              </div>

              <div className="bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100">
                <label className="label-admin mb-4 block">Mensagem Recebida</label>
                <div className="font-medium text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedLead.message}
                </div>
              </div>

              <div>
                <label className="label-admin mb-6 block">Mudar Status do Atendimento</label>
                <div className="flex flex-wrap gap-3">
                  {STATUS_OPTIONS.map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => updateLeadStatus(selectedLead.id, opt)} 
                      className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedLead.status === opt ? 'bg-brand-purple text-white shadow-xl scale-105' : 'bg-white text-gray-300 border border-gray-100 hover:border-brand-purple hover:text-brand-purple'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-10 lg:p-14 bg-gray-50/80 border-t flex flex-col sm:flex-row justify-between items-center gap-6">
              <button 
                onClick={() => deleteItem('leads', selectedLead.id)} 
                className="text-red-500 font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-all group"
              >
                <Trash2 size={20} className="group-hover:rotate-12 transition-transform" /> Excluir Registro Permanente
              </button>
              <a 
                href={`https://wa.me/${selectedLead.whatsapp?.replace(/\D/g,'')}`} 
                target="_blank" 
                className="w-full sm:w-auto bg-green-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-green-100 flex items-center justify-center gap-3 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all"
              >
                <MessageCircle size={28} /> RESPONDER AGORA
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL (PRODUTOS / BLOG) */}
      {isModalOpen && editItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center p-12 border-b bg-gray-50/30">
              <div>
                <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">{editItem.id ? 'Editar' : 'Criar Novo'} {activeTab === 'manage_store' ? 'Material' : 'Artigo'}</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Preencha todos os campos para atualizar seu site.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-brand-dark p-2"><X size={48}/></button>
            </div>
            <form onSubmit={saveFormItem} className="p-12 grid grid-cols-2 gap-10 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="col-span-2"><AdminInput label="Título do Item" value={editItem.title} onChange={v => setEditItem({...editItem, title: v})} /></div>
              {activeTab === 'manage_store' ? (
                <>
                  <AdminInput label="Preço de Venda (R$)" type="number" value={editItem.price} onChange={v => setEditItem({...editItem, price: Number(v)})} />
                  <AdminInput label="Preço de Tabela (R$)" type="number" value={editItem.old_price} onChange={v => setEditItem({...editItem, old_price: Number(v)})} />
                  <div className="col-span-2"><AdminInput label="Checkout URL (Opcional - Sobrescreve Asaas)" value={editItem.checkout_url} onChange={v => setEditItem({...editItem, checkout_url: v})} /></div>
                  <AdminInput label="Categoria do Produto" value={editItem.category} onChange={v => setEditItem({...editItem, category: v})} />
                  <div className="col-span-2"><AdminInput label="Descrição Completa" textarea value={editItem.description} onChange={v => setEditItem({...editItem, description: v})} /></div>
                </>
              ) : (
                <>
                  <AdminInput label="Nome do Autor" value={editItem.author} onChange={v => setEditItem({...editItem, author: v})} />
                  <AdminInput label="Categoria do Artigo" value={editItem.category} onChange={v => setEditItem({...editItem, category: v})} />
                  <div className="col-span-2"><AdminInput label="Conteúdo Rico (Markdown/Texto)" textarea value={editItem.content} onChange={v => setEditItem({...editItem, content: v})} /></div>
                </>
              )}
              <div className="col-span-2">
                <ImageUp label="Imagem de Capa" current={editItem.image_url} onUpload={e => handleImageUpload(e, 'image_url', 'modal')} />
              </div>
              <div className="col-span-2 pt-6">
                <button disabled={loading} className="w-full bg-brand-purple text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-brand-dark transition-all shadow-2xl shadow-purple-200">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={32} /> : 'FINALIZAR E SALVAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .label-admin { display: block; font-size: 0.75rem; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        
        .custom-scrollbar-h::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `}</style>
    </div>
  );
};

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-gray-100">
    <div className="flex items-center gap-4 mb-10 border-b pb-8">
      <div className="bg-brand-lilac/10 p-4 rounded-3xl">{icon}</div>
      <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">{title}</h3>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const AdminInput = ({ label, value, onChange, textarea, type = "text", placeholder }: any) => (
  <div className="w-full">
    <label className="label-admin">{label}</label>
    {textarea ? (
      <textarea rows={6} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-[2.5rem] font-bold text-brand-dark transition-all resize-none outline-none shadow-inner" />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-[1.5rem] font-bold text-brand-dark transition-all outline-none shadow-inner" />
    )}
  </div>
);

const ImageUp = ({ label, current, onUpload }: any) => (
  <div className="space-y-4">
    <label className="label-admin">{label}</label>
    <div className="border-4 border-dashed border-gray-100 rounded-[3rem] p-10 text-center hover:border-brand-purple transition-all relative overflow-hidden bg-gray-50/50 min-h-[220px] flex flex-col items-center justify-center gap-4">
      {current ? (
        <>
          <img src={current} className="max-h-32 rounded-3xl shadow-lg border-2 border-white" />
          <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm">Substituir Imagem</p>
        </>
      ) : (
        <>
          <Upload className="text-gray-200" size={56} />
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Clique ou arraste para enviar</p>
        </>
      )}
      <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  </div>
);
