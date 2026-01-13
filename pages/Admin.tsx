
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Home as HomeIcon, DollarSign, 
  CreditCard, Users, LayoutDashboard, Trash2, Plus, 
  Upload, Image as ImageIcon, FileText, Info, Edit3, X, Loader2, ShoppingCart, Palette, Globe, AlertTriangle,
  Eye, MessageSquare, MessageCircle, Mail, Calendar, GripVertical, Phone, Gem, ExternalLink, Image, Copy, Database,
  Lightbulb, List, LayoutGrid, CheckCircle2, ChevronRight
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
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
          <SidebarItem id="payments" icon={<CreditCard size={20} />} label="Config. Asaas" />
        </nav>
      </aside>

      <div className="flex-grow p-8 lg:p-12 overflow-y-auto max-w-full overflow-x-hidden">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">
            {activeTab === 'leads' ? 'Kanban de Leads' : 
             activeTab === 'manage_store' ? 'Gerenciar Vitrine' :
             activeTab === 'manage_blog' ? 'Gerenciar Blog' :
             activeTab === 'settings' ? 'Aparência do Site' : 'Configurações'}
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

        {/* ... (Other tabs content remains same as provided in previous file content) ... */}
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
            <Section title="Página Sobre" icon={<Info className="text-brand-purple"/>}>
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
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="max-w-4xl space-y-10">
            <Section title="Integração Bancária (Asaas)" icon={<CreditCard className="text-brand-purple"/>}>
              <div className="space-y-6">
                <AdminInput label="Token de Acesso (API Key)" type="password" value={form.asaasapikey} onChange={v => setForm({...form, asaasapikey: v})} />
                <div className="flex items-center gap-4 p-8 bg-brand-cream/50 border border-brand-orange/20 rounded-3xl">
                  <input type="checkbox" id="sandbox_mode" checked={form.asaasissandbox} onChange={e => setForm({...form, asaasissandbox: e.target.checked})} className="w-8 h-8 rounded-lg accent-brand-purple cursor-pointer" />
                  <div>
                    <label htmlFor="sandbox_mode" className="font-black text-brand-dark uppercase text-sm block cursor-pointer">Ambiente de Testes (Sandbox)</label>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1">Marque apenas se estiver usando credenciais de homologação.</p>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* LEAD DETAIL MODAL - KANBAN FIX */}
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
                  <div className="col-span-2"><AdminInput label="Checkout URL (Link Direto Hotmart/Asaas)" value={editItem.checkout_url} onChange={v => setEditItem({...editItem, checkout_url: v})} /></div>
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
                <ImageUp label="Imagem de Capa (800x800 ou 16:9)" current={editItem.image_url} onUpload={e => handleImageUpload(e, 'image_url', 'modal')} />
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

const AdminInput = ({ label, value, onChange, textarea, type = "text" }: any) => (
  <div className="w-full">
    <label className="label-admin">{label}</label>
    {textarea ? (
      <textarea rows={6} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-[2.5rem] font-bold text-brand-dark transition-all resize-none outline-none shadow-inner" />
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-brand-purple focus:bg-white rounded-[1.5rem] font-bold text-brand-dark transition-all outline-none shadow-inner" />
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
