
import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, ChevronLeft, Menu, CheckCircle2, Lock, Download, MessageCircle, Share2, LogOut, Layout, Video, ChevronRight, X } from 'lucide-react';
import { View, Product, ProductMaterial, SiteContent } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

interface CoursePlayerProps {
  productId: string | null;
  onNavigate: (view: View, id?: string) => void;
  user: any;
  content: SiteContent;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ productId, onNavigate, user, content }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<ProductMaterial | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'support'>('overview');

  useEffect(() => {
    if (!productId) {
      onNavigate('my-account');
      return;
    }

    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();
      
      if (data && !error) {
        setProduct(data);
        // Seleciona o primeiro material como ativo automaticamente
        if (data.materials && data.materials.length > 0) {
          setActiveMaterial(data.materials[0]);
        }
      } else {
        onNavigate('my-account');
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId, onNavigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // Lógica simples para YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1] || url.split('/').pop();
      const cleanId = videoId?.split('&')[0];
      return `https://www.youtube.com/embed/${cleanId}?autoplay=0&rel=0&modestbranding=1`;
    }
    // Adicionar lógica para Vimeo/Panda aqui se necessário
    return url;
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div></div>;
  if (!product) return null;

  const isVideo = activeMaterial?.type === 'video';
  const materialsList = product.materials || [];
  
  // Agrupa materiais por "Módulo" (Simulação simples: todos no Módulo 1 se não houver estrutura complexa)
  const hasModules = false; // Futuramente implementar lógica de módulos

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden font-sans">
      <SEO title={`Assistindo: ${product.title}`} description="Área do Aluno - Professora Protagonista" />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar (Listagem de Aulas) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-80 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${!sidebarOpen && 'md:w-0 md:overflow-hidden md:border-none'}`}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('my-account')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="font-black text-white text-sm uppercase tracking-wide truncate max-w-[140px]" title={product.title}>
              {product.title}
            </h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="py-4">
            <div className="px-6 mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Conteúdo do Curso</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-brand-orange h-full w-[10%]"></div> {/* Mock Progress */}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-right">10% Concluído</p>
            </div>

            {/* Lista de Aulas */}
            <div className="space-y-1">
              {materialsList.length > 0 ? materialsList.map((material, idx) => (
                <button
                  key={idx}
                  onClick={() => { setActiveMaterial(material); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-gray-900 transition-colors border-l-4 ${activeMaterial?.id === material.id ? 'bg-gray-900 border-brand-orange' : 'border-transparent'}`}
                >
                  <div className={`mt-0.5 ${activeMaterial?.id === material.id ? 'text-brand-orange' : 'text-gray-500'}`}>
                    {material.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <span className={`text-sm font-medium block leading-snug ${activeMaterial?.id === material.id ? 'text-white' : 'text-gray-400'}`}>
                      {material.title || `Aula ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-gray-600 block mt-1 uppercase tracking-wider font-bold">
                      {material.type === 'video' ? 'Vídeo Aula' : 'Material de Apoio'}
                    </span>
                  </div>
                </button>
              )) : (
                <div className="px-6 py-4 text-gray-500 text-sm italic">Nenhum material cadastrado neste curso.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white p-3 rounded-xl hover:bg-gray-900 transition-all text-xs font-black uppercase tracking-widest">
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col h-full relative w-full">
        {/* Header Interno */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 md:px-8 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg text-white transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="text-white font-bold text-lg hidden sm:block truncate max-w-md">
              {activeMaterial?.title || 'Selecionar Aula'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-gray-800 py-1.5 px-4 rounded-full">
               <div className="w-6 h-6 bg-brand-purple rounded-full flex items-center justify-center text-[10px] font-black text-white">
                 {user.email[0].toUpperCase()}
               </div>
               <span className="text-xs font-bold text-gray-300 hidden sm:block">{user.email}</span>
             </div>
          </div>
        </header>

        {/* Video Player / Content Viewer */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-gray-900">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* Player Container */}
            <div className="aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative border border-gray-800 mb-8 group">
              {activeMaterial ? (
                isVideo ? (
                  <iframe 
                    src={getEmbedUrl(activeMaterial.url)} 
                    className="w-full h-full" 
                    title={activeMaterial.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gray-800/50">
                      <div className="bg-gray-800 p-8 rounded-full text-gray-400 animate-pulse">
                         <FileText size={64} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-black text-white mb-2">{activeMaterial.title}</h3>
                        <p className="text-gray-400 mb-6">Este conteúdo é um arquivo para download ou link externo.</p>
                        <a 
                          href={activeMaterial.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-3 bg-brand-purple text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand-dark transition-all"
                        >
                          <Download size={20} /> Acessar Material
                        </a>
                      </div>
                   </div>
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                  Selecione uma aula no menu lateral para começar.
                </div>
              )}
            </div>

            {/* Navigation & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-gray-800">
               <div>
                  <h1 className="text-2xl font-black text-white mb-2">{activeMaterial?.title}</h1>
                  <p className="text-gray-500 text-sm font-medium">{product.category} • {product.title}</p>
               </div>
               <div className="flex gap-3">
                  <button 
                    disabled={!activeMaterial} 
                    className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Marcar como Concluída
                  </button>
               </div>
            </div>

            {/* Tabs Content */}
            <div>
              <div className="flex gap-8 border-b border-gray-800 mb-8">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Visão Geral
                </button>
                <button 
                  onClick={() => setActiveTab('files')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'files' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Arquivos
                </button>
                <button 
                  onClick={() => setActiveTab('support')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'support' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Suporte & Dúvidas
                </button>
              </div>

              <div className="min-h-[200px]">
                {activeTab === 'overview' && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-400 leading-relaxed text-lg">
                      {product.description || "Sem descrição disponível para este curso."}
                    </p>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {activeMaterial && activeMaterial.type !== 'video' && (
                       <a href={activeMaterial.url} target="_blank" className="bg-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-gray-700 transition-all border border-gray-700 group">
                          <div className="bg-brand-purple/20 p-3 rounded-xl text-brand-purple group-hover:bg-brand-purple group-hover:text-white transition-all">
                             <Download size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold text-white mb-1">{activeMaterial.title}</h4>
                             <p className="text-xs text-gray-500 uppercase font-bold">Material Principal</p>
                          </div>
                       </a>
                     )}
                     {product.download_url && (
                        <a href={product.download_url} target="_blank" className="bg-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:bg-gray-700 transition-all border border-gray-700 group">
                          <div className="bg-brand-orange/20 p-3 rounded-xl text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-all">
                             <Layout size={24} />
                          </div>
                          <div>
                             <h4 className="font-bold text-white mb-1">Pack de Materiais Extra</h4>
                             <p className="text-xs text-gray-500 uppercase font-bold">Download Completo</p>
                          </div>
                       </a>
                     )}
                     {(!activeMaterial || (activeMaterial.type === 'video' && !product.download_url)) && (
                        <p className="text-gray-500 italic">Nenhum arquivo anexado a esta aula.</p>
                     )}
                  </div>
                )}

                {activeTab === 'support' && (
                  <div className="bg-gray-800/50 p-8 rounded-3xl border border-gray-800 text-center max-w-2xl mx-auto">
                     <MessageCircle size={48} className="mx-auto text-brand-purple mb-6" />
                     <h3 className="text-2xl font-black text-white mb-4">Precisa de Ajuda com a Aula?</h3>
                     <p className="text-gray-400 mb-8 leading-relaxed">
                       Nossa equipe pedagógica está pronta para tirar suas dúvidas sobre o conteúdo desta aula. Envie sua pergunta diretamente pelo WhatsApp.
                     </p>
                     <a 
                       href={`https://wa.me/${content.supportwhatsapp}?text=Olá, tenho uma dúvida na aula: ${activeMaterial?.title} do curso ${product.title}`}
                       target="_blank"
                       className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg"
                     >
                       <MessageCircle size={20} /> Chamar no Suporte
                     </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111827; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4B5563; }
      `}</style>
    </div>
  );
};
