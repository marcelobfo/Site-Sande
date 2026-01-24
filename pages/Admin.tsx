
import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Home as HomeIcon, CreditCard, LayoutDashboard, Plus, 
  FileText, Info, X, Loader2, Palette, Gem, LogOut, ShieldAlert, Link as LinkIcon, Type,
  Youtube, HardDrive, Trash2, Video, GripVertical, Clock, Layers
} from 'lucide-react';
import { SiteContent, Product, BlogPost, View, ProductMaterial } from '../types';
import { supabase } from '../lib/supabase';
import { NotificationType } from '../components/Notification';

// Sub-componentes
import { AdminLeads } from './admin/Leads';
import { AdminProducts } from './admin/Products';
import { AdminBlog } from './admin/Blog';
import { AdminAppearance } from './admin/Appearance';
import { AdminPayments } from './admin/Payments';
import { AdminInput, ImageUp, Section } from '../components/admin/AdminShared';

interface AdminProps {
  content: SiteContent;
  onUpdate: (content: SiteContent) => Promise<void>;
  onNavigate: (view: View) => void;
  notify: (type: NotificationType, title: string, message: string) => void;
}

type Tab = 'leads' | 'content_home' | 'content_about' | 'manage_store' | 'manage_blog' | 'settings' | 'payments';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return 'Erro desconhecido ao processar solicitação';
};

export const Admin: React.FC<AdminProps> = ({ content, onUpdate, onNavigate, notify }) => {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [form, setForm] = useState<SiteContent>(content);
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAllData();
    setForm({ ...content, homeherotitlesize: content.homeherotitlesize ?? 6.5 });
  }, [content, activeTab]);

  const fetchAllData = async () => {
    if (activeTab === 'leads') {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data) setLeads(data);
    }
    if (activeTab === 'manage_store') {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts(data);
    }
    if (activeTab === 'manage_blog') {
      const { data } = await supabase.from('blog_posts').select('*').order('publish_date', { ascending: false });
      if (data) setPosts(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    notify('info', 'Sessão Encerrada', 'Você saiu do painel.');
    onNavigate('home');
  };

  const handleSaveContent = async () => {
    setSavingSettings(true);
    try {
      await onUpdate(form);
    } catch (err) {
      // Erro tratado no App.tsx
    } 
    finally { setSavingSettings(false); }
  };

  const handleImageUpload = (e: any, field: string, target: 'site' | 'modal' = 'site') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'site') setForm(prev => ({ ...prev, [field]: reader.result as string }));
        else setEditItem((prev: any) => ({ ...prev, [field]: reader.result as string }));
        notify('info', 'Imagem Carregada', 'A imagem foi processada.');
      };
      reader.readAsDataURL(file);
    }
  };

  const saveFormItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const table = activeTab === 'manage_store' ? 'products' : 'blog_posts';
    
    try {
      const payload: any = {
        title: editItem.title,
        category: editItem.category,
        image_url: editItem.image_url,
      };

      if (table === 'products') {
        payload.price = editItem.price;
        payload.description = editItem.description;
        payload.download_url = editItem.download_url;
        payload.materials = editItem.materials && Array.isArray(editItem.materials) ? editItem.materials : [];
      } else {
        payload.content = editItem.content;
        payload.publish_date = editItem.publish_date;
      }

      if (editItem.id) {
        const { error } = await supabase.from(table).update(payload).eq('id', editItem.id);
        if (error) throw error;
        notify('success', 'Atualizado', 'Registro salvo com sucesso.');
      } else {
        const { error } = await supabase.from(table).insert([payload]);
        if (error) throw error;
        notify('success', 'Criado', 'Novo item adicionado.');
      }
      
      await fetchAllData();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const message = getErrorMessage(err);
      
      if (message.includes('column "materials" of relation "products" does not exist') || message.includes('download_url')) {
         notify('error', 'Banco de Dados Desatualizado', 'Colunas faltando. Rode o script SQL no Supabase.');
      } else {
         notify('error', 'Erro ao salvar', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar materiais (Course Builder)
  const addMaterial = () => {
    const newMaterial: ProductMaterial = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      type: 'video',
      url: '',
      module: 'Módulo 1',
      duration: ''
    };
    setEditItem({ ...editItem, materials: [...(editItem.materials || []), newMaterial] });
  };

  const updateMaterial = (index: number, field: keyof ProductMaterial, value: string) => {
    const newMaterials = [...(editItem.materials || [])];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setEditItem({ ...editItem, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = [...(editItem.materials || [])];
    newMaterials.splice(index, 1);
    setEditItem({ ...editItem, materials: newMaterials });
  };

  const SidebarItem = ({ id, icon, label }: { id: Tab, icon: React.ReactNode, label: string }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === id ? 'bg-brand-purple text-white shadow-xl' : 'text-gray-400 hover:bg-brand-lilac/10'}`}>
      <div className="shrink-0">{icon}</div>
      <span className={`whitespace-nowrap transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'leads': return <AdminLeads leads={leads} onUpdate={fetchAllData} notify={notify} />;
      case 'manage_store': return <AdminProducts products={products} onEdit={(p) => { setEditItem(p); setIsModalOpen(true); }} onDelete={async (id) => { if(confirm("Excluir?")){ await supabase.from('products').delete().eq('id', id); fetchAllData(); notify('success', 'Excluído', 'Produto removido.'); } }} />;
      case 'manage_blog': return <AdminBlog posts={posts} onEdit={(p) => { setEditItem(p); setIsModalOpen(true); }} onDelete={async (id) => { if(confirm("Excluir?")){ await supabase.from('blog_posts').delete().eq('id', id); fetchAllData(); notify('success', 'Excluído', 'Post removido.'); } }} />;
      case 'settings': return <AdminAppearance form={form} setForm={setForm} onImageUpload={handleImageUpload} />;
      case 'payments': return <AdminPayments form={form} setForm={setForm} notify={notify} />;
      case 'content_home': return (
        <div className="max-w-5xl space-y-10">
          <Section title="Hero Principal" icon={<HomeIcon />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <AdminInput label="Título Hero" value={form.homeherotitle} onChange={(v: string) => setForm({...form, homeherotitle: v})} />
                <AdminInput label="Tamanho da Fonte (REM) - Desktop" type="number" step="0.1" icon={<Type size={16}/>} value={form.homeherotitlesize} onChange={(v: string) => setForm({...form, homeherotitlesize: Number(v)})} />
                <AdminInput label="Subtítulo Hero" textarea value={form.homeherosub} onChange={(v: string) => setForm({...form, homeherosub: v})} />
              </div>
              <ImageUp label="Foto Hero" current={form.homeheroimageurl} onUpload={(e: any) => handleImageUpload(e, 'homeheroimageurl')} />
            </div>
          </Section>
          <Section title="Clube" icon={<Gem />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <AdminInput label="Nome Clube" value={form.clubetitle} onChange={(v: string) => setForm({...form, clubetitle: v})} />
                <AdminInput label="Preço" type="number" value={form.clubeprice} onChange={(v: string) => setForm({...form, clubeprice: Number(v)})} />
              </div>
              <ImageUp label="Banner Clube" current={form.clubebannerimageurl} onUpload={(e: any) => handleImageUpload(e, 'clubebannerimageurl')} />
            </div>
          </Section>
        </div>
      );
      case 'content_about': return (
        <div className="max-w-5xl space-y-10">
          <Section title="Sobre / Empresa" icon={<Info />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <AdminInput label="Título" value={form.abouttitle} onChange={(v: string) => setForm({...form, abouttitle: v})} />
                <AdminInput label="Texto Bio" textarea value={form.abouttext} onChange={(v: string) => setForm({...form, abouttext: v})} />
              </div>
              <ImageUp label="Foto Perfil" current={form.abouttrajectoryimageurl} onUpload={(e: any) => handleImageUpload(e, 'abouttrajectoryimageurl')} />
            </div>
          </Section>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex max-w-full overflow-hidden font-sans">
      <aside onMouseEnter={() => setIsSidebarExpanded(true)} onMouseLeave={() => setIsSidebarExpanded(false)} className={`bg-white border-r p-6 flex flex-col transition-all duration-300 h-screen sticky top-0 z-40 shrink-0 ${isSidebarExpanded ? 'w-72' : 'w-24'}`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-brand-dark p-2.5 rounded-xl text-white shadow-lg"><Settings size={24} /></div>
          <h2 className={`font-black text-xl tracking-tighter transition-opacity ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>ADMIN</h2>
        </div>
        <nav className="space-y-2 flex-grow overflow-y-auto no-scrollbar">
          <SidebarItem id="leads" icon={<LayoutDashboard size={20} />} label="CRM de Leads" />
          <SidebarItem id="manage_store" icon={<Gem size={20} />} label="Vitrine & Loja" />
          <SidebarItem id="manage_blog" icon={<FileText size={20} />} label="Blog & Posts" />
          <div className="h-px bg-gray-100 my-4 mx-2"></div>
          <SidebarItem id="content_home" icon={<HomeIcon size={20} />} label="Home & Clube" />
          <SidebarItem id="content_about" icon={<Info size={20} />} label="Sobre & Empresa" />
          <SidebarItem id="settings" icon={<Palette size={20} />} label="Aparência" />
          <SidebarItem id="payments" icon={<CreditCard size={20} />} label="Pagamentos" />
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all">
          <LogOut size={20} />
          <span className={`whitespace-nowrap ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>Sair</span>
        </button>
      </aside>

      <div className="flex-grow overflow-y-auto max-w-full overflow-x-hidden custom-scrollbar bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-8 lg:p-12">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div>
              <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter mb-1">
                {activeTab === 'leads' ? 'Kanban de Leads' : 
                activeTab === 'manage_store' ? 'Gestão da Vitrine' :
                activeTab === 'manage_blog' ? 'Gestão do Blog' : 'Painel Master'}
              </h1>
              <p className="text-gray-400 font-medium text-sm">Controle total da plataforma Lax.</p>
            </div>
            <div className="flex gap-4">
              {['content_home', 'content_about', 'settings', 'payments'].includes(activeTab) && (
                <button onClick={handleSaveContent} disabled={savingSettings} className="bg-brand-purple text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-brand-dark transition-all">
                  {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SALVAR
                </button>
              )}
              {(activeTab === 'manage_store' || activeTab === 'manage_blog') && (
                <button onClick={() => { setEditItem({}); setIsModalOpen(true); }} className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-brand-dark transition-all">
                  <Plus size={20} /> NOVO
                </button>
              )}
            </div>
          </header>

          {renderContent()}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">{editItem.id ? 'Editar Conteúdo' : 'Novo Conteúdo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all"><X size={24} className="text-gray-300" /></button>
            </div>
            <form onSubmit={saveFormItem} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {activeTab === 'manage_store' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminInput label="Nome do Produto/Curso" value={editItem.title} onChange={(v: string) => setEditItem({...editItem, title: v})} required />
                    <AdminInput label="Preço (R$)" type="number" value={editItem.price} onChange={(v: string) => setEditItem({...editItem, price: Number(v)})} required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminInput label="Categoria" value={editItem.category} onChange={(v: string) => setEditItem({...editItem, category: v})} required />
                    <AdminInput label="Link Externo (Checkout/Fallback)" icon={<LinkIcon size={14}/>} value={editItem.download_url} onChange={(v: string) => setEditItem({...editItem, download_url: v})} placeholder="Ex: Link do Google Drive para backup" />
                  </div>

                  <AdminInput label="Descrição Completa" textarea value={editItem.description} onChange={(v: string) => setEditItem({...editItem, description: v})} required />

                  {/* Course Builder Section */}
                  <div className="bg-gray-50 p-6 md:p-8 rounded-[2.5rem] border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <div>
                        <h4 className="text-xl font-black text-brand-dark uppercase tracking-tight flex items-center gap-2">
                          <LayoutDashboard className="text-brand-purple" size={20} /> Estrutura do Curso
                        </h4>
                        <p className="text-xs text-gray-400 font-bold mt-1">Cadastre as aulas, vídeos e materiais complementares.</p>
                      </div>
                      <button type="button" onClick={addMaterial} className="bg-brand-purple text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-dark transition-all shadow-lg">
                        <Plus size={16} /> Nova Aula
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {editItem.materials?.map((mat: ProductMaterial, idx: number) => (
                        <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center group">
                          <div className="p-3 bg-gray-50 rounded-2xl text-gray-300 cursor-move shrink-0">
                            <GripVertical size={20} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow w-full">
                            {/* Linha 1: Módulo e Título */}
                            <div className="md:col-span-3">
                               <div className="flex items-center gap-2 mb-1.5 md:hidden">
                                  <Layers size={12} className="text-gray-400"/>
                                  <span className="text-[10px] font-black uppercase text-gray-400">Módulo</span>
                               </div>
                               <input 
                                 placeholder="Módulo 1" 
                                 value={mat.module || ''} 
                                 onChange={(e) => updateMaterial(idx, 'module', e.target.value)}
                                 className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-brand-dark border border-gray-200 focus:border-brand-purple outline-none"
                               />
                            </div>
                            
                            <div className="md:col-span-6">
                               <div className="flex items-center gap-2 mb-1.5 md:hidden">
                                  <FileText size={12} className="text-gray-400"/>
                                  <span className="text-[10px] font-black uppercase text-gray-400">Título da Aula</span>
                               </div>
                               <input 
                                 placeholder="Título da Aula..." 
                                 value={mat.title || ''} 
                                 onChange={(e) => updateMaterial(idx, 'title', e.target.value)}
                                 className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-brand-dark border border-gray-200 focus:border-brand-purple outline-none"
                               />
                            </div>

                            <div className="md:col-span-3">
                               <div className="flex items-center gap-2 mb-1.5 md:hidden">
                                  <Settings size={12} className="text-gray-400"/>
                                  <span className="text-[10px] font-black uppercase text-gray-400">Tipo</span>
                               </div>
                               <select 
                                 value={mat.type} 
                                 onChange={(e) => updateMaterial(idx, 'type', e.target.value as any)}
                                 className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold text-brand-dark border border-gray-200 focus:border-brand-purple outline-none"
                               >
                                 <option value="video">Vídeo</option>
                                 <option value="file">Arquivo</option>
                                 <option value="link">Link</option>
                                 <option value="drive">Drive</option>
                               </select>
                            </div>

                            {/* Linha 2: URL e Duração */}
                            <div className="md:col-span-9">
                               <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                     {mat.type === 'video' ? <Video size={14} /> : <LinkIcon size={14} />}
                                  </div>
                                  <input 
                                    placeholder={mat.type === 'video' ? "Link do YouTube, Vimeo..." : "URL do Arquivo ou Drive..."} 
                                    value={mat.url || ''} 
                                    onChange={(e) => updateMaterial(idx, 'url', e.target.value)}
                                    className="w-full pl-9 p-3 bg-gray-50 rounded-xl text-xs font-bold text-brand-dark border border-gray-200 focus:border-brand-purple outline-none"
                                  />
                               </div>
                            </div>

                            <div className="md:col-span-3">
                               <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                     <Clock size={14} />
                                  </div>
                                  <input 
                                    placeholder="00:00" 
                                    value={mat.duration || ''} 
                                    onChange={(e) => updateMaterial(idx, 'duration', e.target.value)}
                                    className="w-full pl-9 p-3 bg-gray-50 rounded-xl text-xs font-bold text-brand-dark border border-gray-200 focus:border-brand-purple outline-none"
                                  />
                               </div>
                            </div>
                          </div>

                          <button type="button" onClick={() => removeMaterial(idx)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl shrink-0 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      
                      {(!editItem.materials || editItem.materials.length === 0) && (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
                          <LayoutDashboard size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Nenhuma aula cadastrada</p>
                          <p className="text-xs text-gray-400 mt-1">Clique em "Nova Aula" para começar.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <ImageUp label="Capa do Produto" current={editItem.image_url} onUpload={(e: any) => handleImageUpload(e, 'image_url', 'modal')} />
                </>
              ) : (
                <>
                  <AdminInput label="Título Post" value={editItem.title} onChange={(v: string) => setEditItem({...editItem, title: v})} required />
                  <AdminInput label="Conteúdo (Markdown)" textarea value={editItem.content} onChange={(v: string) => setEditItem({...editItem, content: v})} required />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminInput label="Categoria" value={editItem.category} onChange={(v: string) => setEditItem({...editItem, category: v})} required />
                    <AdminInput label="Data" type="date" value={editItem.publish_date ? new Date(editItem.publish_date).toISOString().split('T')[0] : ''} onChange={(v: string) => setEditItem({...editItem, publish_date: v})} required />
                  </div>
                  <ImageUp label="Capa do Artigo" current={editItem.image_url} onUpload={(e: any) => handleImageUpload(e, 'image_url', 'modal')} />
                </>
              )}
              <div className="pt-8 border-t border-gray-100">
                <button type="submit" disabled={loading} className="w-full bg-brand-purple text-white py-6 rounded-3xl font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:bg-brand-dark transition-all">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
