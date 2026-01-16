
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Home as HomeIcon, DollarSign, 
  CreditCard, Users, LayoutDashboard, Trash2, Plus, 
  Upload, Image as ImageIcon, FileText, Info, Edit3, X, Loader2, ShoppingCart, Palette, Globe, AlertTriangle,
  Eye, MessageSquare, MessageCircle, Mail, Calendar, GripVertical, Phone, Gem, ExternalLink, Image, Copy, Database,
  Lightbulb, List, LayoutGrid, CheckCircle2, ChevronRight, ShieldCheck, RefreshCcw, Server, Terminal, Check, Wifi, WifiOff,
  Package, Tag, BarChart3, Target, TrendingUp
} from 'lucide-react';
import { SiteContent, Lead, LeadStatus, Product, BlogPost } from '../types';
import { supabase } from '../lib/supabase';

interface AdminProps {
  content: SiteContent;
  onUpdate: (content: SiteContent) => Promise<void>;
}

type Tab = 'leads' | 'content_home' | 'content_about' | 'manage_store' | 'manage_blog' | 'settings' | 'payments';

const STATUS_OPTIONS: LeadStatus[] = ['Novo', 'Aguardando Pagamento', 'Pago', 'Cancelado', 'Em Contato', 'Fechado', 'Perdido'];

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

  const deleteItem = async (table: string, id: string) => {
    if (confirm("Deseja realmente excluir?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert("Erro ao excluir");
      else {
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
    const sql = `ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS value NUMERIC,
ADD COLUMN IF NOT EXISTS payment_id TEXT;
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

      <div className="flex-grow p-8 lg:p-12 overflow-y-auto max-w-full overflow-x-hidden custom-scrollbar">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">
            {activeTab === 'leads' ? 'Kanban de Leads' : 
             activeTab === 'manage_store' ? 'Gerenciar Vitrine' :
             activeTab === 'manage_blog' ? 'Gerenciar Blog' :
             activeTab === 'settings' ? 'Aparência & Tracking' : 
             activeTab === 'payments' ? 'Pagamentos Asaas' : 'Configurações'}
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

        {showSuccess && <div className="bg-green-500 text-white p-6 rounded-2xl font-black mb-8 flex items-center gap-3"><CheckCircle2 /> Salvo com sucesso!</div>}
        {errorMessage && <div className="bg-red-500 text-white p-6 rounded-2xl font-black mb-8 flex items-center gap-3"><AlertTriangle /> {errorMessage}</div>}

        {activeTab === 'leads' && (
          <div className="flex gap-6 overflow-x-auto pb-10 min-h-[75vh] custom-scrollbar-h">
            {STATUS_OPTIONS.map(status => (
              <div key={status} className="bg-gray-200/40 p-6 rounded-[2.5rem] min-w-[340px] flex flex-col border border-gray-200/50 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6 px-2">
                  <h4 className="font-black text-[11px] uppercase text-gray-500 tracking-widest">{status}</h4>
                  <div className="flex items-center gap-2">
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-brand-purple shadow-sm">
                      {leads.filter(l => l.status === status).length}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 flex-grow">
                  {leads.filter(l => l.status === status).map(lead => (
                    <div key={lead.id} onClick={() => { setSelectedLead(lead); setIsLeadDetailOpen(true); }} className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group relative overflow-hidden">
                      {/* Highlighted Value Badge - IMPROVED */}
                      {lead.value && (
                        <div className={`absolute top-0 right-0 px-5 py-2 rounded-bl-[1.5rem] font-black text-[12px] shadow-sm transition-colors ${lead.status === 'Pago' ? 'bg-green-500 text-white' : 'bg-brand-orange text-white'}`}>
                          R$ {Number(lead.value).toFixed(2)}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <p className="font-black text-brand-dark text-lg leading-tight group-hover:text-brand-purple transition-colors truncate pr-12">{lead.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">{lead.subject}</p>
                      </div>

                      {lead.product_name && (
                        <div className="bg-brand-cream/50 p-2.5 rounded-xl mb-4 flex items-center gap-2 border border-brand-orange/10">
                          <Package size={14} className="text-brand-orange" />
                          <span className="text-[9px] font-black text-brand-dark/70 truncate uppercase">{lead.product_name}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold">{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {lead.status === 'Pago' && <div className="bg-green-100 p-1.5 rounded-full text-green-500"><CheckCircle2 size={14} /></div>}
                          <Eye size={16} className="text-brand-purple opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESTORED: Vitrine de Materiais */}
        {activeTab === 'manage_store' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                <div className="aspect-square relative overflow-hidden">
                  <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => { setEditItem(p); setIsModalOpen(true); }} className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-brand-purple shadow-lg"><Edit3 size={18} /></button>
                    <button onClick={() => deleteItem('products', p.id)} className="p-3 bg-white/90 backdrop-blur-md rounded-xl text-red-500 shadow-lg"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-black text-brand-orange uppercase mb-1">{p.category}</p>
                  <h4 className="font-black text-brand-dark mb-4 line-clamp-1">{p.title}</h4>
                  <p className="font-black text-brand-purple text-xl">R$ {Number(p.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESTORED: Conteúdo Blog */}
        {activeTab === 'manage_blog' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                  <th className="p-6">Título</th>
                  <th className="p-6">Categoria</th>
                  <th className="p-6">Data</th>
                  <th className="p-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="p-6 font-black text-brand-dark">{post.title}</td>
                    <td className="p-6 text-sm font-bold text-gray-500">{post.category}</td>
                    <td className="p-6 text-sm text-gray-400">{new Date(post.publish_date).toLocaleDateString()}</td>
                    <td className="p-6 flex gap-2">
                      <button onClick={() => { setEditItem(post); setIsModalOpen(true); }} className="p-2 text-brand-purple hover:bg-brand-lilac/10 rounded-lg"><Edit3 size={18} /></button>
                      <button onClick={() => deleteItem('blog_posts', post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESTORED: Home & Clube */}
        {activeTab === 'content_home' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Hero & Cabeçalho" icon={<HomeIcon className="text-brand-purple"/>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminInput label="Título do Hero" value={form.homeherotitle} onChange={v => setForm({...form, homeherotitle: v})} />
                <AdminInput label="Subtítulo do Hero" textarea value={form.homeherosub} onChange={v => setForm({...form, homeherosub: v})} />
              </div>
              <ImageUp label="Imagem do Hero" current={form.homeheroimageurl} onUpload={e => handleImageUpload(e, 'homeheroimageurl', 'site')} />
            </Section>
            <Section title="Clube Protagonista" icon={<Gem className="text-brand-orange"/>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminInput label="Título do Clube" value={form.clubetitle} onChange={v => setForm({...form, clubetitle: v})} />
                <AdminInput label="Preço Anual" type="number" value={form.clubeprice} onChange={v => setForm({...form, clubeprice: Number(v)})} />
                <div className="md:col-span-2">
                  <AdminInput label="Descrição Curta" textarea value={form.clubedescription} onChange={v => setForm({...form, clubedescription: v})} />
                </div>
              </div>
              <ImageUp label="Banner do Clube" current={form.clubebannerimageurl} onUpload={e => handleImageUpload(e, 'clubebannerimageurl', 'site')} />
            </Section>
          </div>
        )}

        {/* RESTORED: Sobre & Contato */}
        {activeTab === 'content_about' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Sobre a Sande / Lax" icon={<Info className="text-brand-purple"/>}>
              <AdminInput label="Texto Biográfico" textarea value={form.abouttext} onChange={v => setForm({...form, abouttext: v})} />
              <ImageUp label="Foto da Trajetória" current={form.abouttrajectoryimageurl} onUpload={e => handleImageUpload(e, 'abouttrajectoryimageurl', 'site')} />
            </Section>
            <Section title="Galeria & Contato" icon={<ImageIcon className="text-brand-orange"/>}>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ImageUp label="Galeria 1" current={form.aboutfeaturedimage1} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage1', 'site')} />
                  <ImageUp label="Galeria 2" current={form.aboutfeaturedimage2} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage2', 'site')} />
                  <ImageUp label="Galeria 3" current={form.aboutfeaturedimage3} onUpload={e => handleImageUpload(e, 'aboutfeaturedimage3', 'site')} />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                 <AdminInput label="WhatsApp de Suporte" value={form.supportwhatsapp} onChange={v => setForm({...form, supportwhatsapp: v})} />
                 <AdminInput label="E-mail de Suporte" value={form.supportemail} onChange={v => setForm({...form, supportemail: v})} />
               </div>
            </Section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl space-y-12">
             <Section title="Marketing & Tracking" icon={<Target className="text-brand-purple"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AdminInput label="Google Analytics ID" placeholder="G-XXXXXXX" value={form.google_analytics_id} onChange={v => setForm({...form, google_analytics_id: v})} />
                  <AdminInput label="Meta Pixel ID" placeholder="1234..." value={form.meta_pixel_id} onChange={v => setForm({...form, meta_pixel_id: v})} />
                </div>
                <AdminInput label="Token API Meta" textarea value={form.meta_api_token} onChange={v => setForm({...form, meta_api_token: v})} />
             </Section>
             <Section title="Logotipo & Favicon" icon={<Palette className="text-brand-purple"/>}>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <ImageUp label="Logotipo" current={form.logourl} onUpload={e => handleImageUpload(e, 'logourl', 'site')} />
                 <ImageUp label="Favicon" current={form.faviconurl} onUpload={e => handleImageUpload(e, 'faviconurl', 'site')} />
               </div>
             </Section>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Integração Bancária Asaas" icon={<CreditCard className="text-brand-purple"/>}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminInput label="API Key Produção" type="password" value={form.asaas_production_key} onChange={v => setForm({...form, asaas_production_key: v})} />
                <AdminInput label="API Key Sandbox" type="password" value={form.asaas_sandbox_key} onChange={v => setForm({...form, asaas_sandbox_key: v})} />
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <input type="checkbox" id="use_sandbox" checked={form.asaas_use_sandbox} onChange={e => setForm({...form, asaas_use_sandbox: e.target.checked})} className="w-6 h-6 rounded-lg accent-brand-purple" />
                <label htmlFor="use_sandbox" className="font-black text-xs uppercase text-gray-400">Usar Ambiente Sandbox</label>
              </div>
              <AdminInput label="URL do Webhook Backend" placeholder="https://..." value={form.asaas_backend_url} onChange={v => setForm({...form, asaas_backend_url: v})} />
              
              <div className="mt-8 bg-gray-900 rounded-3xl p-8 text-white relative border-t-4 border-brand-orange shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={20} className="text-brand-orange" />
                  <h4 className="font-black text-xs uppercase tracking-widest">Database Sync (Kanban)</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium mb-4">Execute no Supabase para habilitar rastreamento de produtos no Kanban:</p>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-[10px] text-green-400 relative">
                  <button onClick={copySql} className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <pre className="whitespace-pre-wrap leading-relaxed">
{`ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS value NUMERIC,
ADD COLUMN IF NOT EXISTS payment_id TEXT;
NOTIFY pgrst, 'reload schema';`}
                  </pre>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* Modal Genérico (Produtos e Blog) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95">
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
                  <AdminInput label="Autor" value={editItem.author || 'Sande Almeida'} onChange={v => setEditItem({...editItem, author: v})} />
                  <AdminInput label="Conteúdo (Markdown)" textarea value={editItem.content} onChange={v => setEditItem({...editItem, content: v})} required />
                  <ImageUp label="Imagem Capa" current={editItem.image_url} onUpload={e => handleImageUpload(e, 'image_url', 'modal')} />
                </>
              )}
              <div className="pt-6">
                <button type="submit" disabled={loading} className="w-full bg-brand-purple text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> SALVAR ALTERAÇÕES</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detalhe do Lead */}
      {isLeadDetailOpen && selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b flex justify-between items-center">
                <h3 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">{selectedLead.name}</h3>
                <button onClick={() => setIsLeadDetailOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl"><X size={24} className="text-gray-300" /></button>
             </div>
             <div className="p-10 space-y-6">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{selectedLead.subject}</p>
                <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 italic">"{selectedLead.message}"</div>
                
                {selectedLead.value && (
                  <div className="flex items-center gap-3 bg-brand-orange/10 p-4 rounded-2xl border border-brand-orange/20">
                    <TrendingUp className="text-brand-orange" />
                    <span className="font-black text-brand-dark">Valor do Lead: <span className="text-brand-orange">R$ {Number(selectedLead.value).toFixed(2)}</span></span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                   {STATUS_OPTIONS.map(opt => (
                     <button key={opt} onClick={() => updateLeadStatus(selectedLead.id, opt)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${selectedLead.status === opt ? 'bg-brand-purple text-white' : 'bg-white border text-gray-300'}`}>{opt}</button>
                   ))}
                </div>
                <div className="flex gap-4 pt-6">
                   <a href={`https://wa.me/${selectedLead.whatsapp?.replace(/\D/g,'')}`} target="_blank" className="flex-grow bg-green-500 text-white py-4 rounded-2xl font-black text-center shadow-lg">WHATSAPP</a>
                   <button onClick={() => deleteItem('leads', selectedLead.id)} className="bg-red-50 text-red-500 px-6 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 /></button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ESTILOS CUSTOMIZADOS PARA ROLAGEM SUAVE */}
      <style>{`
        .custom-scrollbar-h::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar-h::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 20px; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb { background: #D8B4FE; border-radius: 20px; border: 2px solid #F1F5F9; }
        .custom-scrollbar-h::-webkit-scrollbar-thumb:hover { background: #7E22CE; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const Section = ({ title, icon, children }: any) => (
  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
    <div className="flex items-center gap-4 mb-8 border-b pb-6">
      <div className="bg-brand-lilac/10 p-3 rounded-2xl">{icon}</div>
      <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">{title}</h3>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

const AdminInput = ({ label, value, onChange, textarea, type = "text", placeholder, required }: any) => (
  <div className="w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">{label} {required && '*'}</label>
    {textarea ? (
      <textarea rows={5} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-2xl font-bold text-brand-dark transition-all resize-none outline-none shadow-inner" />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-xl font-bold text-brand-dark transition-all outline-none shadow-inner" />
    )}
  </div>
);

const ImageUp = ({ label, current, onUpload }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">{label}</label>
    <div className="border-2 border-dashed border-gray-100 rounded-3xl p-6 text-center hover:border-brand-purple transition-all relative overflow-hidden bg-gray-50/50 min-h-[160px] flex flex-col items-center justify-center gap-3">
      {current ? (
        <img src={current} className="max-h-24 rounded-xl shadow-md border-2 border-white" />
      ) : (
        <Upload className="text-gray-200" size={40} />
      )}
      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{current ? 'Substituir' : 'Enviar'}</p>
      <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
    </div>
  </div>
);
