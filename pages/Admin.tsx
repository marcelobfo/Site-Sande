
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Home as HomeIcon, DollarSign, 
  CreditCard, Users, LayoutDashboard, Trash2, Plus, 
  Upload, Image as ImageIcon, FileText, Info, Edit3, X, Loader2, ShoppingCart, Palette, Globe, AlertTriangle,
  Eye, MessageSquare, MessageCircle, Mail, Calendar, GripVertical, Phone, Gem, ExternalLink, Image, Copy, Database,
  Lightbulb, List, LayoutGrid, CheckCircle2, ChevronRight, ShieldCheck, RefreshCcw, Server, Terminal, Check, Wifi, WifiOff,
  Package, Tag, BarChart3, Target, TrendingUp, MapPin, Activity, LogOut, ShieldAlert, BarChart, Code
} from 'lucide-react';
import { SiteContent, Lead, LeadStatus, Product, BlogPost, View } from '../types';
import { supabase } from '../lib/supabase';
import { NotificationType } from '../components/Notification';

interface AdminProps {
  content: SiteContent;
  onUpdate: (content: SiteContent) => Promise<void>;
  onNavigate: (view: View) => void;
  notify: (type: NotificationType, title: string, message: string) => void;
}

type Tab = 'leads' | 'content_home' | 'content_about' | 'manage_store' | 'manage_blog' | 'settings' | 'payments';

const STATUS_OPTIONS: LeadStatus[] = ['Novo', 'Aguardando Pagamento', 'Pago', 'Cancelado', 'Em Contato', 'Fechado', 'Perdido'];

export const Admin: React.FC<AdminProps> = ({ content, onUpdate, onNavigate, notify }) => {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [blogViewMode, setBlogViewMode] = useState<'grid' | 'list'>('list');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [form, setForm] = useState<SiteContent>(content);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAllData();
    setForm(content);
  }, [content, activeTab]);

  const fetchAllData = async () => {
    if (activeTab === 'leads') fetchLeads();
    if (activeTab === 'manage_store') fetchProducts();
    if (activeTab === 'manage_blog') fetchBlog();
    if (activeTab === 'payments') fetchWebhookLogs();
  };

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

  const fetchWebhookLogs = async () => {
    const { data } = await supabase.from('leads').select('id, name, email, status, payment_id, created_at').not('payment_id', 'is', null).order('created_at', { ascending: false });
    if (data) setWebhookLogs(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    notify('info', 'Sessão Encerrada', 'Você saiu do painel administrativo.');
    onNavigate('home');
  };

  const handleSaveContent = async () => {
    setSavingSettings(true);
    try {
      await onUpdate(form);
      // O App.tsx já dispara o notify de sucesso via handleUpdateContent
    } catch (err: any) {
      // Erro já tratado no App.tsx
    } finally {
      setSavingSettings(false);
    }
  };

  const deleteItem = async (table: string, id: string) => {
    if (confirm("Deseja realmente excluir este item permanentemente?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        notify('error', 'Erro na Exclusão', error.message);
      } else {
        notify('success', 'Item Removido', 'O item foi excluído com sucesso.');
        if (table === 'products') fetchProducts();
        else if (table === 'blog_posts') fetchBlog();
        else if (table === 'leads') { fetchLeads(); setIsLeadDetailOpen(false); }
      }
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      notify('success', 'Status Atualizado', `Lead alterado para: ${newStatus}`);
    } else {
      notify('error', 'Erro', 'Não foi possível atualizar o status.');
    }
  };

  const saveFormItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const table = activeTab === 'manage_store' ? 'products' : 'blog_posts';
    try {
      if (editItem.id) {
        await supabase.from(table).update(editItem).eq('id', editItem.id);
        notify('success', 'Atualizado', 'Item salvo com sucesso.');
      } else {
        await supabase.from(table).insert([editItem]);
        notify('success', 'Criado', 'Novo item adicionado à vitrine.');
      }
      if (table === 'products') fetchProducts(); else fetchBlog();
      setIsModalOpen(false);
    } catch (err: any) {
      notify('error', 'Falha ao Salvar', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string, target: 'site' | 'modal') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify('warning', 'Arquivo Grande', 'Tente usar imagens menores que 2MB para melhor performance.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'site') setForm(prev => ({ ...prev, [field]: reader.result as string }));
        else setEditItem((prev: any) => ({ ...prev, [field]: reader.result as string }));
        notify('info', 'Imagem Carregada', 'A imagem foi processada com sucesso.');
      };
      reader.readAsDataURL(file);
    }
  };

  const copySql = () => {
    const sql = `-- Código para executar no SQL Editor do Supabase para promover admin:
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'SEU_EMAIL_AQUI';`;
    navigator.clipboard.writeText(sql);
    notify('success', 'Copiado!', 'Comando SQL disponível na sua área de transferência.');
  };

  const SidebarItem = ({ id, icon, label }: { id: Tab, icon: React.ReactNode, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === id ? 'bg-brand-purple text-white shadow-xl' : 'text-gray-400 hover:bg-brand-lilac/10'}`}>
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
        <button onClick={handleLogout} className="mt-8 flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={20} />
          <span className={`whitespace-nowrap ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>Sair</span>
        </button>
      </aside>

      <div className="flex-grow overflow-y-auto max-w-full overflow-x-hidden custom-scrollbar bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-8 lg:p-12">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white/50 p-8 rounded-[2.5rem] border border-gray-100 backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">
                  {activeTab === 'leads' ? 'Kanban de Leads' : 
                  activeTab === 'manage_store' ? 'Gerenciar Vitrine' :
                  activeTab === 'manage_blog' ? 'Gerenciar Blog' :
                  activeTab === 'settings' ? 'Aparência & Branding' : 
                  activeTab === 'payments' ? 'Pagamentos Asaas' : 'Configurações'}
                </h1>
                <div className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldAlert size={12} /> Super Admin
                </div>
              </div>
              
              {(activeTab === 'manage_store' || activeTab === 'manage_blog') && (
                 <div className="flex items-center gap-4 mt-4 bg-white p-2 rounded-xl border border-gray-100 w-fit">
                   <button onClick={() => activeTab === 'manage_store' ? setViewMode('grid') : setBlogViewMode('grid')} className={`p-2 rounded-lg ${(activeTab === 'manage_store' ? viewMode : blogViewMode) === 'grid' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400'}`}><LayoutGrid size={16}/></button>
                   <button onClick={() => activeTab === 'manage_store' ? setViewMode('list') : setBlogViewMode('list')} className={`p-2 rounded-lg ${(activeTab === 'manage_store' ? viewMode : blogViewMode) === 'list' ? 'bg-brand-purple text-white shadow-md' : 'text-gray-400'}`}><List size={16}/></button>
                 </div>
              )}
            </div>

            <div className="flex gap-4">
              {['content_home', 'content_about', 'settings', 'payments'].includes(activeTab) && (
                <button onClick={handleSaveContent} disabled={savingSettings} className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                  {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SALVAR
                </button>
              )}
              {(activeTab === 'manage_store' || activeTab === 'manage_blog') && (
                <button onClick={() => { setEditItem({}); setIsModalOpen(true); }} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                  <Plus size={20} /> ADICIONAR NOVO
                </button>
              )}
            </div>
          </header>

          {activeTab === 'leads' && (
            <div className="flex gap-6 overflow-x-auto pb-10 min-h-[75vh] custom-scrollbar-h">
              {STATUS_OPTIONS.map(status => (
                <div key={status} className="bg-gray-200/40 p-6 rounded-[2.5rem] min-w-[340px] flex flex-col border border-gray-200/50 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h4 className="font-black text-[11px] uppercase text-gray-500 tracking-widest">{status}</h4>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-brand-purple shadow-sm">
                      {leads.filter(l => l.status === status).length}
                    </span>
                  </div>
                  <div className="space-y-4 flex-grow">
                    {leads.filter(l => l.status === status).map(lead => (
                      <div key={lead.id} onClick={() => { setSelectedLead(lead); setIsLeadDetailOpen(true); }} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden flex flex-col">
                        <div className="mb-4">
                          <p className="font-black text-brand-dark text-lg leading-tight group-hover:text-brand-purple transition-colors truncate pr-4">{lead.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">{lead.email}</p>
                        </div>
                        
                        <div className="mt-auto space-y-3">
                          {lead.product_name && (
                            <div className="bg-brand-cream/50 p-2.5 rounded-xl flex items-center gap-2 border border-brand-orange/10">
                              <Package size={14} className="text-brand-orange" />
                              <span className="text-[9px] font-black text-brand-dark/70 truncate uppercase">{lead.product_name}</span>
                            </div>
                          )}
                          
                          {lead.value && (
                            <div className={`px-4 py-1.5 rounded-full font-black text-[10px] w-fit shadow-sm ${lead.status === 'Pago' ? 'bg-green-50 text-white' : 'bg-brand-purple/10 text-brand-purple'}`}>
                              R$ {Number(lead.value).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'manage_store' && (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" : "space-y-4"}>
              {products.map(product => (
                viewMode === 'grid' ? (
                  <div key={product.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
                    <img src={product.image_url} className="w-full aspect-square object-cover" />
                    <div className="p-6">
                      <h4 className="font-black text-brand-dark truncate">{product.title}</h4>
                      <div className="flex gap-2 mt-4">
                         <button onClick={() => { setEditItem(product); setIsModalOpen(true); }} className="p-2 bg-brand-purple/5 text-brand-purple rounded-lg"><Edit3 size={16}/></button>
                         <button onClick={() => deleteItem('products', product.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={product.id} className="bg-white p-4 rounded-2xl flex items-center gap-6 shadow-sm border border-gray-50 group hover:border-brand-purple transition-all">
                    <img src={product.image_url} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-grow">
                      <h4 className="font-black text-brand-dark">{product.title}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.category} • R$ {Number(product.price).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(product); setIsModalOpen(true); }} className="p-3 text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => deleteItem('products', product.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {activeTab === 'manage_blog' && (
            <div className={blogViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
              {posts.map(post => (
                blogViewMode === 'grid' ? (
                  <div key={post.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
                    <img src={post.image_url} className="w-full aspect-video object-cover" />
                    <div className="p-6">
                      <h4 className="font-black text-brand-dark truncate">{post.title}</h4>
                      <div className="flex gap-2 mt-4">
                         <button onClick={() => { setEditItem(post); setIsModalOpen(true); }} className="p-2 bg-brand-purple/5 text-brand-purple rounded-lg"><Edit3 size={16}/></button>
                         <button onClick={() => deleteItem('blog_posts', post.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={post.id} className="bg-white p-4 rounded-2xl flex items-center gap-6 shadow-sm border border-gray-50 group hover:border-brand-purple transition-all">
                    <img src={post.image_url} className="w-24 h-16 rounded-xl object-cover" />
                    <div className="flex-grow">
                      <h4 className="font-black text-brand-dark truncate">{post.title}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{post.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditItem(post); setIsModalOpen(true); }} className="p-3 text-brand-purple hover:bg-brand-purple/5 rounded-xl transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => deleteItem('blog_posts', post.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {activeTab === 'content_home' && (
            <div className="max-w-5xl space-y-10">
              <Section title="Hero & Cabeçalho" icon={<HomeIcon className="text-brand-purple"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <AdminInput label="Título do Hero" value={form.homeherotitle} onChange={v => setForm({...form, homeherotitle: v})} />
                    <AdminInput label="Subtítulo do Hero" textarea value={form.homeherosub} onChange={v => setForm({...form, homeherosub: v})} />
                  </div>
                  <ImageUp label="Imagem do Hero" current={form.homeheroimageurl} onUpload={e => handleImageUpload(e, 'homeheroimageurl', 'site')} />
                </div>
              </Section>
              
              <Section title="Clube Protagonista" icon={<Gem className="text-brand-orange"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <AdminInput label="Título do Clube" value={form.clubetitle} onChange={v => setForm({...form, clubetitle: v})} />
                    <AdminInput label="Preço Anual" type="number" value={form.clubeprice} onChange={v => setForm({...form, clubeprice: Number(v)})} />
                    <AdminInput label="Descrição Curta" textarea value={form.clubedescription} onChange={v => setForm({...form, clubedescription: v})} />
                  </div>
                  <ImageUp label="Banner do Clube" current={form.clubebannerimageurl} onUpload={e => handleImageUpload(e, 'clubebannerimageurl', 'site')} />
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'content_about' && (
            <div className="max-w-5xl space-y-10">
              <Section title="Sobre a Sande / Empresa" icon={<Info className="text-brand-purple"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <AdminInput label="Título da Seção" value={form.abouttitle} onChange={v => setForm({...form, abouttitle: v})} />
                    <AdminInput label="Texto de Biografia" textarea value={form.abouttext} onChange={v => setForm({...form, abouttext: v})} />
                  </div>
                  <ImageUp label="Imagem da Trajetória" current={form.abouttrajectoryimageurl} onUpload={e => handleImageUpload(e, 'abouttrajectoryimageurl', 'site')} />
                </div>
              </Section>

              <Section title="Galeria Destaque" icon={<Image className="text-brand-orange"/>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ImageUp label="Imagem 1" current={form.aboutfeaturedimage1} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage1', 'site')} />
                  <ImageUp label="Imagem 2" current={form.aboutfeaturedimage2} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage2', 'site')} />
                  <ImageUp label="Imagem 3" current={form.aboutfeaturedimage3} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage3', 'site')} />
                </div>
              </Section>

              <Section title="Contatos de Suporte" icon={<MessageCircle className="text-brand-pink"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AdminInput label="WhatsApp de Suporte (DDI+DDD+Número)" value={form.supportwhatsapp} onChange={v => setForm({...form, supportwhatsapp: v})} />
                  <AdminInput label="E-mail de Contato" value={form.supportemail} onChange={v => setForm({...form, supportemail: v})} />
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-5xl space-y-10">
              <Section title="Branding & Identidade" icon={<Palette className="text-brand-purple"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUp label="Logotipo Principal" current={form.logourl} onUpload={e => handleImageUpload(e, 'logourl', 'site')} />
                  <ImageUp label="Favicon (Ícone Aba)" current={form.faviconurl} onUpload={e => handleImageUpload(e, 'faviconurl', 'site')} />
                </div>
              </Section>

              <Section title="Marketing & Analytics" icon={<BarChart className="text-brand-orange"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AdminInput label="Google Analytics ID (G-XXXXXX)" value={form.google_analytics_id} onChange={v => setForm({...form, google_analytics_id: v})} />
                  <AdminInput label="Meta Pixel ID" value={form.meta_pixel_id} onChange={v => setForm({...form, meta_pixel_id: v})} />
                  <div className="md:col-span-2">
                    <AdminInput label="Meta API Token (CAPI)" value={form.meta_api_token} onChange={v => setForm({...form, meta_api_token: v})} />
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="max-w-5xl space-y-10">
              <Section title="Integração Asaas" icon={<CreditCard className="text-brand-purple"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AdminInput label="Backend Checkout URL" value={form.asaas_backend_url} onChange={v => setForm({...form, asaas_backend_url: v})} placeholder="https://..." />
                  <div className="flex items-center gap-4 pt-8">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Modo Sandbox?</label>
                    <button onClick={() => setForm({...form, asaas_use_sandbox: !form.asaas_use_sandbox})} className={`w-14 h-8 rounded-full relative transition-all ${form.asaas_use_sandbox ? 'bg-brand-orange' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${form.asaas_use_sandbox ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <AdminInput label="Chave Sandbox" value={form.asaas_sandbox_key} onChange={v => setForm({...form, asaas_sandbox_key: v})} type="password" />
                  <AdminInput label="Chave Produção" value={form.asaas_production_key} onChange={v => setForm({...form, asaas_production_key: v})} type="password" />
                </div>
              </Section>

              <Section title="Histórico de Vendas" icon={<Activity className="text-brand-orange"/>}>
                 <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm overflow-x-auto">
                   <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b">
                       <tr>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Data</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">ID Pagamento</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {webhookLogs.map(log => (
                         <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4 text-[11px] font-bold text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                           <td className="px-6 py-4 text-[12px] font-black text-brand-dark whitespace-nowrap">{log.name}</td>
                           <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{log.payment_id}</td>
                           <td className="px-6 py-4">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${log.status === 'Pago' ? 'bg-green-100 text-green-600' : 'bg-brand-orange/10 text-brand-orange'}`}>
                               {log.status}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </Section>
              
              <Section title="Super Admin Promotor" icon={<ShieldAlert className="text-brand-purple"/>}>
                 <div className="bg-brand-dark p-10 rounded-[2.5rem] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <Code className="text-brand-orange" />
                        <h4 className="text-xl font-black uppercase tracking-tight">Utilidade de Banco de Dados</h4>
                      </div>
                      <p className="text-sm font-medium text-gray-300 mb-8 max-w-2xl">Use o comando SQL abaixo no seu dashboard do Supabase para promover novos e-mails a administradores manualmente.</p>
                      <button onClick={copySql} className="bg-brand-purple px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-brand-orange transition-all shadow-2xl">
                        <Copy size={18} /> COPIAR COMANDO SQL
                      </button>
                    </div>
                 </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">{editItem.id ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X size={24} className="text-gray-300" /></button>
            </div>
            <form onSubmit={saveFormItem} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {activeTab === 'manage_store' ? (
                <>
                  <AdminInput label="Título" value={editItem.title} onChange={v => setEditItem({...editItem, title: v})} required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminInput label="Preço" type="number" value={editItem.price} onChange={v => setEditItem({...editItem, price: Number(v)})} required />
                    <AdminInput label="Categoria" value={editItem.category} onChange={v => setEditItem({...editItem, category: v})} required />
                  </div>
                  <AdminInput label="Descrição" textarea value={editItem.description} onChange={v => setEditItem({...editItem, description: v})} required />
                  <ImageUp label="Imagem" current={editItem.image_url} onUpload={e => handleImageUpload(e, 'image_url', 'modal')} />
                </>
              ) : (
                <>
                  <AdminInput label="Título do Post" value={editItem.title} onChange={v => setEditItem({...editItem, title: v})} required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminInput label="Categoria" value={editItem.category} onChange={v => setEditItem({...editItem, category: v})} required />
                    <AdminInput label="Data Publicação" type="date" value={editItem.publish_date} onChange={v => setEditItem({...editItem, publish_date: v})} required />
                  </div>
                  <AdminInput label="Conteúdo (Markdown)" textarea value={editItem.content} onChange={v => setEditItem({...editItem, content: v})} required />
                  <ImageUp label="Imagem Capa" current={editItem.image_url} onUpload={e => handleImageUpload(e, 'image_url', 'modal')} />
                </>
              )}
              <div className="pt-6">
                <button type="submit" disabled={loading} className="w-full bg-brand-purple text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLeadDetailOpen && selectedLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
             <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">{selectedLead.name}</h3>
                <button onClick={() => setIsLeadDetailOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X size={24} className="text-gray-300" /></button>
             </div>
             <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DetailRow icon={<Mail />} label="E-mail" value={selectedLead.email} />
                  <DetailRow icon={<Phone />} label="WhatsApp" value={selectedLead.whatsapp} />
                </div>
                <div className="space-y-4">
                   <h4 className="font-black text-xs uppercase tracking-widest text-brand-purple">Status do Atendimento</h4>
                   <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => updateLeadStatus(selectedLead.id, opt)} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLead.status === opt ? 'bg-brand-purple text-white shadow-lg' : 'bg-white border text-gray-400 hover:border-brand-purple'}`}>{opt}</button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar-h::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 20px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #D8B4FE; border-radius: 20px; border: 2px solid #F1F5F9; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
    <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-8">
      <div className="bg-brand-lilac/10 p-4 rounded-2xl shadow-inner">{icon}</div>
      <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight">{title}</h3>
    </div>
    <div className="space-y-8">{children}</div>
  </div>
);

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => (
  <div className="flex items-center gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
    <div className="bg-white p-4 rounded-2xl text-brand-purple shrink-0 shadow-sm">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="font-bold text-brand-dark text-base break-all">{value || 'Não informado'}</p>
    </div>
  </div>
);

const AdminInput = ({ label, value, onChange, textarea, type = "text", placeholder, required }: any) => (
  <div className="w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block pl-1">{label} {required && '*'}</label>
    {textarea ? (
      <textarea rows={6} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-6 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-purple focus:bg-white rounded-[2rem] font-bold text-brand-dark transition-all resize-none outline-none shadow-sm" />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-8 py-5 bg-gray-50/50 border-2 border-gray-100 focus:border-brand-purple focus:bg-white rounded-2xl font-bold text-brand-dark transition-all outline-none shadow-sm" />
    )}
  </div>
);

const ImageUp = ({ label, current, onUpload }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block pl-1">{label}</label>
    <div className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-8 text-center hover:border-brand-purple hover:bg-white transition-all relative overflow-hidden bg-gray-50/50 min-h-[220px] flex flex-col items-center justify-center gap-4 group">
      {current ? (
        <div className="relative">
          <img src={current} className="max-h-32 rounded-2xl shadow-xl border-4 border-white transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-brand-dark/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <RefreshCcw className="text-white" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="p-5 bg-white rounded-full shadow-sm text-gray-300 group-hover:text-brand-purple transition-colors">
            <Upload size={32} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arraste ou clique aqui</p>
        </div>
      )}
      <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  </div>
);
