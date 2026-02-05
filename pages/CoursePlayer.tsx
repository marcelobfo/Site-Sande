
import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, FileText, ChevronLeft, Menu, CheckCircle2, Lock, Download, MessageCircle, Share2, LogOut, Layout, Video, ChevronRight, X, Info, Send, Smile, ShieldCheck } from 'lucide-react';
import { View, Product, ProductMaterial, SiteContent, ProductForumMessage } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import Hls from 'hls.js';

interface CoursePlayerProps {
  productId: string | null;
  onNavigate: (view: View, id?: string) => void;
  user: any;
  content: SiteContent;
  isAdmin?: boolean;
}

// Sub-componente para renderizar o Player correto
const VideoPlayer = ({ url, type, title }: { url: string, type?: 'youtube' | 'panda_embed' | 'panda_hls', title?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type === 'panda_hls' && Hls.isSupported() && videoRef.current) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      return () => {
        hls.destroy();
      };
    } else if (type === 'panda_hls' && videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Suporte nativo para Safari
      videoRef.current.src = url;
    }
  }, [url, type]);

  if (!url) return null;

  if (type === 'panda_hls') {
    return (
      <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain bg-black"
        poster="https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Sande-Almeida-Hero.png" // Opcional: Fallback poster
      >
        <source src={url} type="application/x-mpegURL" />
        Seu navegador não suporta este vídeo.
      </video>
    );
  }

  // Embed (YouTube ou Panda Iframe)
  let embedUrl = url;
  if (type === 'youtube' || !type) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1] || url.split('/').pop();
      const cleanId = videoId?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${cleanId}?autoplay=0&rel=0&modestbranding=1`;
    }
  }

  // Se for Panda Embed, a URL já deve ser o link do player ou iframe src.
  // Se o usuário colou o código <iframe> inteiro, precisamos extrair o src, mas aqui assumimos URL direta.
  
  return (
    <iframe 
      src={embedUrl} 
      className="w-full h-full" 
      title={title || "Video Player"}
      frameBorder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowFullScreen
    ></iframe>
  );
};

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ productId, onNavigate, user, content, isAdmin }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<ProductMaterial | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'support' | 'forum'>('overview');
  const [showingFeaturedVideo, setShowingFeaturedVideo] = useState(false);

  // Forum State
  const [messages, setMessages] = useState<ProductForumMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        // Se houver vídeo de destaque, mostra ele primeiro
        if (data.featured_video_url) {
          setShowingFeaturedVideo(true);
        } else if (data.materials && data.materials.length > 0) {
          setActiveMaterial(data.materials[0]);
        }
      } else {
        onNavigate('my-account');
      }
      setLoading(false);
    };

    fetchProduct();
  }, [productId, onNavigate]);

  useEffect(() => {
    if (activeTab === 'forum' && productId) {
      fetchMessages();
      
      const channel = supabase
        .channel(`product_forum:${productId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_forum_messages', filter: `product_id=eq.${productId}` }, (payload) => {
           if (payload.eventType === 'INSERT') {
             setMessages(prev => [...prev, payload.new as ProductForumMessage]);
             setTimeout(scrollToBottom, 100);
           } else if (payload.eventType === 'UPDATE') {
             setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as ProductForumMessage : m));
           }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [activeTab, productId]);

  const fetchMessages = async () => {
    if (!productId) return;
    const { data } = await supabase.from('product_forum_messages').select('*').eq('product_id', productId).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !productId) return;

    const { error } = await supabase.from('product_forum_messages').insert([{
      product_id: productId,
      user_email: user.email,
      user_name: user.email.split('@')[0],
      content: newMessage,
      reactions: {}
    }]);

    if (error) {
        console.error('Erro ao enviar:', error);
        alert('Erro ao enviar mensagem.');
    } else {
        setNewMessage('');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !user) return;

    const currentReactions = message.reactions || {};
    const usersReacted = currentReactions[emoji] || [];
    
    let newReactions;
    if (usersReacted.includes(user.email)) {
      // Remove reaction
      newReactions = { ...currentReactions, [emoji]: usersReacted.filter(e => e !== user.email) };
      if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
      // Add reaction
      newReactions = { ...currentReactions, [emoji]: [...usersReacted, user.email] };
    }

    const { error } = await supabase.from('product_forum_messages').update({ reactions: newReactions }).eq('id', messageId);
    if (error) {
        console.error('Erro reação:', error);
        alert('Falha ao processar reação.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate('home');
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div></div>;
  if (!product) return null;

  const isVideo = showingFeaturedVideo ? true : activeMaterial?.type === 'video';
  const materialsList = product.materials || [];
  
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
            {/* Link para Vídeo de Destaque / Instruções */}
            {product.featured_video_url && (
              <div className="px-6 mb-6">
                <button 
                  onClick={() => { setShowingFeaturedVideo(true); setActiveMaterial(null); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`w-full bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-xl flex items-center gap-3 hover:bg-brand-orange/20 transition-all ${showingFeaturedVideo ? 'ring-2 ring-brand-orange' : ''}`}
                >
                  <Info className="text-brand-orange" size={20} />
                  <div className="text-left">
                    <span className="text-xs font-black text-brand-orange uppercase tracking-widest block">Comece Aqui</span>
                    <span className="text-[10px] text-gray-400">Instruções de Uso</span>
                  </div>
                </button>
              </div>
            )}

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
                  onClick={() => { setActiveMaterial(material); setShowingFeaturedVideo(false); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`w-full text-left px-6 py-4 flex items-start gap-4 hover:bg-gray-900 transition-colors border-l-4 ${activeMaterial?.id === material.id && !showingFeaturedVideo ? 'bg-gray-900 border-brand-orange' : 'border-transparent'}`}
                >
                  <div className={`mt-0.5 ${(activeMaterial?.id === material.id && !showingFeaturedVideo) ? 'text-brand-orange' : 'text-gray-500'}`}>
                    {material.type === 'video' ? <PlayCircle size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <span className={`text-sm font-medium block leading-snug ${(activeMaterial?.id === material.id && !showingFeaturedVideo) ? 'text-white' : 'text-gray-400'}`}>
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
              {showingFeaturedVideo ? "Instruções de Uso & Boas-Vindas" : (activeMaterial?.title || 'Selecionar Aula')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {isAdmin && (
               <span className="bg-brand-purple/20 text-brand-purple px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-purple/30 flex items-center gap-2">
                 <ShieldCheck size={12} /> Visão Admin
               </span>
             )}
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
              {(activeMaterial || showingFeaturedVideo) ? (
                isVideo ? (
                  <VideoPlayer 
                    url={showingFeaturedVideo ? (product.featured_video_url || '') : (activeMaterial?.url || '')}
                    type={showingFeaturedVideo ? (product.featured_video_type || 'youtube') : (activeMaterial?.video_type || 'youtube')}
                    title={showingFeaturedVideo ? "Instruções" : activeMaterial?.title}
                  />
                ) : (
                   <div className="w-full h-full relative group">
                      {/* Background Image with Blur */}
                      <img 
                        src={product.image_url} 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm transition-all group-hover:blur-none group-hover:opacity-60" 
                        alt={product.title} 
                      />
                      <div className="absolute inset-0 bg-black/60"></div>

                      {/* Content Overlay */}
                      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-6 p-8">
                          <div className="bg-gray-900/80 p-6 rounded-full text-gray-300 backdrop-blur-md border border-white/10 shadow-2xl">
                             <FileText size={48} />
                          </div>
                          <div className="text-center max-w-2xl">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 drop-shadow-lg">{activeMaterial?.title}</h3>
                            <p className="text-gray-200 mb-8 font-medium drop-shadow-md">Este conteúdo é um arquivo para download ou link externo.</p>
                            <a 
                              href={activeMaterial?.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 bg-brand-purple text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-xl hover:scale-105"
                            >
                              <Download size={20} /> Acessar Material
                            </a>
                          </div>
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
                  <h1 className="text-2xl font-black text-white mb-2">
                    {showingFeaturedVideo ? "Instruções de Uso" : activeMaterial?.title}
                  </h1>
                  <p className="text-gray-500 text-sm font-medium">{product.category} • {product.title}</p>
               </div>
               <div className="flex gap-3">
                  {!showingFeaturedVideo && (
                    <button 
                      disabled={!activeMaterial} 
                      className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Marcar como Concluída
                    </button>
                  )}
               </div>
            </div>

            {/* Tabs Content */}
            <div>
              <div className="flex gap-8 border-b border-gray-800 mb-8 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'overview' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Visão Geral
                </button>
                <button 
                  onClick={() => setActiveTab('files')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'files' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Arquivos
                </button>
                {product.forum_active && (
                  <button 
                    onClick={() => setActiveTab('forum')}
                    className={`pb-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'forum' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                  >
                    Comunidade <span className="bg-brand-purple/20 px-2 py-0.5 rounded text-[9px] font-bold text-brand-purple hidden md:inline-block">BETA</span>
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab('support')}
                  className={`pb-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'support' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-gray-500 hover:text-white'}`}
                >
                  Suporte & Dúvidas
                </button>
              </div>

              <div className="min-h-[200px]">
                {activeTab === 'overview' && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-line">
                      {product.description || "Sem descrição disponível para este curso."}
                    </p>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {activeMaterial && activeMaterial.type !== 'video' && !showingFeaturedVideo && (
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

                {activeTab === 'forum' && (
                  <div className="bg-gray-950 rounded-3xl border border-gray-800 overflow-hidden flex flex-col h-[600px]">
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <MessageCircle size={48} className="mb-4 opacity-20" />
                          <p className="font-medium text-sm">Seja o primeiro a comentar nesta aula!</p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <div key={msg.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-brand-lilac font-black text-sm shrink-0 border border-gray-700">
                              {msg.user_name[0].toUpperCase()}
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-sm">{msg.user_name}</span>
                                <span className="text-[10px] text-gray-500">{new Date(msg.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="bg-gray-800/50 p-4 rounded-2xl rounded-tl-none border border-gray-700 text-gray-300 text-sm leading-relaxed">
                                {msg.content}
                              </div>
                              <div className="flex gap-2 mt-2">
                                {['👍', '❤️', '😂', '👏', '🔥'].map(emoji => {
                                  const count = msg.reactions?.[emoji]?.length || 0;
                                  const userReacted = msg.reactions?.[emoji]?.includes(user.email);
                                  if (count === 0) return null;
                                  return (
                                    <button 
                                      key={emoji}
                                      onClick={() => handleReaction(msg.id, emoji)}
                                      className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${userReacted ? 'bg-brand-purple/20 border-brand-purple text-brand-lilac' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                    >
                                      {emoji} {count}
                                    </button>
                                  );
                                })}
                                <div className="relative group/emoji">
                                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white p-1">
                                    <Smile size={16} />
                                  </button>
                                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl p-2 flex gap-1 hidden group-hover/emoji:flex shadow-xl z-10">
                                    {['👍', '❤️', '😂', '👏', '🔥'].map(emoji => (
                                      <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="hover:bg-gray-700 p-1.5 rounded-lg transition-colors text-lg">
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 bg-gray-900 border-t border-gray-800">
                      <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Digite sua mensagem, dúvida ou feedback..." 
                          className="flex-grow bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-brand-purple outline-none transition-colors"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="bg-brand-purple text-white p-3 rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
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
                       href={`https://wa.me/${content.supportwhatsapp}?text=Olá, tenho uma dúvida na aula: ${showingFeaturedVideo ? "Instruções" : activeMaterial?.title} do curso ${product.title}`}
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
