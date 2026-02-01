
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2, Eye, ArrowLeft, Loader2, User, Calendar, Plus, X, Send, ShieldCheck, BarChart2 } from 'lucide-react';
import { ForumTopic, ForumPost } from '../../types';
import { supabase } from '../../lib/supabase';

interface AdminForumProps {
  topics: ForumTopic[];
  onRefresh: () => void;
  notify: (type: any, title: string, message: string) => void;
}

export const AdminForum: React.FC<AdminForumProps> = ({ topics, onRefresh, notify }) => {
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [poll, setPoll] = useState<any>(null);
  
  // Estados de Criação e Resposta
  const [isCreating, setIsCreating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [newTopicData, setNewTopicData] = useState({ title: '', category: 'Avisos Oficiais', content: '', question: '', options: ['', ''] });
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async (topicId: string) => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setPosts(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setLoadingPosts(false);
  };

  const fetchPoll = async (topicId: string) => {
    const { data: pollData } = await supabase.from('forum_polls').select('*, forum_poll_options(*), forum_poll_votes(*)').eq('topic_id', topicId).single();
    setPoll(pollData || null);
  };

  // Realtime para ver mensagens chegando enquanto admin está no tópico
  useEffect(() => {
    if (!selectedTopic) return;

    fetchPosts(selectedTopic.id);
    fetchPoll(selectedTopic.id);

    const channel = supabase
      .channel(`admin-topic-${selectedTopic.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts', filter: `topic_id=eq.${selectedTopic.id}` }, (payload) => {
        setPosts(prev => [...prev, payload.new as ForumPost]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_poll_votes' }, () => {
         fetchPoll(selectedTopic.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTopic]);

  const handleSelectTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm("ATENÇÃO: Excluir este tópico apagará todas as mensagens e votos associados a ele. Tem certeza?")) {
      const { error } = await supabase.from('forum_topics').delete().eq('id', id);
      if (error) {
        notify('error', 'Erro', 'Não foi possível excluir o tópico.');
      } else {
        notify('success', 'Sucesso', 'Tópico excluído.');
        if (selectedTopic?.id === id) setSelectedTopic(null);
        onRefresh();
      }
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Excluir esta mensagem permanentemente?")) {
      const { error } = await supabase.from('forum_posts').delete().eq('id', id);
      if (error) {
        notify('error', 'Erro', 'Não foi possível excluir a mensagem.');
      } else {
        notify('success', 'Sucesso', 'Mensagem removida.');
        setPosts(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTopic) return;
    setSending(true);

    try {
      const { error } = await supabase.from('forum_posts').insert([{
        topic_id: selectedTopic.id,
        content: replyText,
        author_name: 'Equipe Sande Almeida',
        author_email: 'contato@metodoprotagonizar.com.br',
        is_admin: true
      }]);

      if (error) throw error;
      setReplyText('');
      // Realtime irá atualizar a lista
    } catch (err) {
      notify('error', 'Erro ao responder', 'Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // 1. Criar Tópico
      const { data: topic, error: topicError } = await supabase.from('forum_topics').insert([{
        title: newTopicData.title,
        category: newTopicData.category,
        author_name: 'Equipe Sande Almeida',
        author_email: 'contato@metodoprotagonizar.com.br'
      }]).select().single();

      if (topicError) throw topicError;

      // 2. Criar Enquete (se houver)
      if (newTopicData.question && newTopicData.options.every(o => o.trim() !== '') && topic) {
        const { data: pollData } = await supabase.from('forum_polls').insert([{
          topic_id: topic.id,
          question: newTopicData.question
        }]).select().single();

        if (pollData) {
          const optionsPayload = newTopicData.options.map(opt => ({
            poll_id: pollData.id,
            option_text: opt
          }));
          await supabase.from('forum_poll_options').insert(optionsPayload);
        }
      }

      // 3. Criar Primeira Mensagem (Corpo do Tópico)
      if (newTopicData.content && topic) {
        await supabase.from('forum_posts').insert([{
          topic_id: topic.id,
          content: newTopicData.content,
          author_name: 'Equipe Sande Almeida',
          author_email: 'contato@metodoprotagonizar.com.br',
          is_admin: true
        }]);
      }

      notify('success', 'Tópico Criado', 'A discussão foi iniciada.');
      setIsCreating(false);
      setNewTopicData({ title: '', category: 'Avisos Oficiais', content: '', question: '', options: ['', ''] });
      onRefresh();
    } catch (err: any) {
      notify('error', 'Erro ao criar', err.message);
    } finally {
      setSending(false);
    }
  };

  // Helpers para enquete no modal
  const addOption = () => setNewTopicData({...newTopicData, options: [...newTopicData.options, '']});
  const updateOption = (idx: number, val: string) => {
    const opts = [...newTopicData.options];
    opts[idx] = val;
    setNewTopicData({...newTopicData, options: opts});
  };

  return (
    <div className="space-y-6">
      {selectedTopic ? (
        // VISÃO DETALHADA DO TÓPICO (MENSAGENS + RESPOSTA)
        <div className="animate-in fade-in slide-in-from-right-4 flex flex-col h-[calc(100vh-200px)]">
          {/* Header do Tópico */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedTopic(null)} 
                className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight line-clamp-1">{selectedTopic.title}</h3>
                <p className="text-xs text-gray-400 font-bold flex items-center gap-2">
                  <User size={12} /> {selectedTopic.author_name} • {selectedTopic.category}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleDeleteTopic(selectedTopic.id)}
              className="text-red-500 text-[10px] font-black uppercase hover:bg-red-50 px-3 py-2 rounded-lg transition-all flex items-center gap-2 border border-red-100"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-grow">
             {/* Lista de Mensagens */}
             <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50/50">
                {/* Visualização da Enquete para Admin */}
                {poll && (
                  <div className="mb-6 p-6 bg-white rounded-3xl border border-brand-lilac/20 shadow-sm">
                    <h4 className="font-black text-brand-dark mb-4 flex items-center gap-2 text-sm">
                      <BarChart2 className="text-brand-orange" size={18} /> Enquete: {poll.question}
                    </h4>
                    <div className="space-y-3">
                      {poll.forum_poll_options?.map((opt: any) => {
                        const votes = poll.forum_poll_votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                        const total = poll.forum_poll_votes?.length || 0;
                        const percent = total > 0 ? (votes / total) * 100 : 0;
                        return (
                          <div key={opt.id} className="relative h-10 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-brand-purple/10 transition-all duration-500" style={{width: `${percent}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                              <span className="text-xs font-bold text-gray-600">{opt.option_text}</span>
                              <span className="text-[10px] font-black text-brand-purple">{votes} votos ({Math.round(percent)}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {loadingPosts ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-purple" /></div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">Nenhuma mensagem neste tópico.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className={`flex gap-4 group ${post.is_admin ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${post.is_admin ? 'bg-brand-orange text-white' : 'bg-white text-brand-purple border border-gray-100'}`}>
                        {post.is_admin ? <ShieldCheck size={16} /> : post.author_name[0].toUpperCase()}
                      </div>
                      <div className={`flex flex-col max-w-[80%] ${post.is_admin ? 'items-end' : 'items-start'}`}>
                         <div className="flex items-center gap-2 mb-1 px-1">
                            {post.is_admin && <span className="text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 rounded font-black uppercase">Admin</span>}
                            <span className="font-bold text-gray-600 text-xs">{post.author_name}</span>
                            <span className="text-[9px] text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
                         </div>
                         <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm relative group-hover:shadow-md transition-all ${post.is_admin ? 'bg-brand-dark text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-600 rounded-tl-none'}`}>
                            {post.content}
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className={`absolute top-2 ${post.is_admin ? 'left-2 text-white/30 hover:text-white' : 'right-2 text-gray-300 hover:text-red-500'} opacity-0 group-hover:opacity-100 transition-opacity p-1`}
                              title="Excluir Mensagem"
                            >
                              <Trash2 size={12} />
                            </button>
                         </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
             </div>

             {/* Área de Resposta */}
             <div className="p-4 bg-white border-t border-gray-100">
               <form onSubmit={handleReply} className="flex gap-3">
                 <input 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta oficial aqui..."
                    className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 font-medium transition-all"
                 />
                 <button 
                    type="submit" 
                    disabled={!replyText.trim() || sending}
                    className="bg-brand-purple text-white p-4 rounded-2xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                 >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                 </button>
               </form>
             </div>
          </div>
        </div>
      ) : (
        // LISTAGEM DE TÓPICOS
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
             <h3 className="text-lg font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
               <MessageSquare className="text-brand-purple" size={20} /> Tópicos da Comunidade
             </h3>
             <button 
               onClick={() => setIsCreating(true)}
               className="bg-brand-orange text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-brand-dark transition-all flex items-center gap-2"
             >
               <Plus size={16} /> Novo Tópico
             </button>
          </div>
          <div className="divide-y divide-gray-50 flex-grow overflow-y-auto custom-scrollbar">
            {topics.length === 0 ? (
              <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-4">
                <MessageSquare size={48} className="opacity-20" />
                <p>Nenhum tópico criado ainda.</p>
              </div>
            ) : (
              topics.map(topic => (
                <div key={topic.id} className="p-6 hover:bg-gray-50 transition-all flex items-center justify-between group cursor-pointer" onClick={() => handleSelectTopic(topic)}>
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-lilac/10 p-3 rounded-2xl text-brand-purple shrink-0">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-brand-dark text-sm mb-1">{topic.title}</h4>
                       <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className={`px-2 py-0.5 rounded text-white ${topic.author_name === 'Equipe Sande Almeida' ? 'bg-brand-orange' : 'bg-gray-200 text-gray-500'}`}>{topic.category}</span>
                          <span className="flex items-center gap-1"><User size={12}/> {topic.author_name}</span>
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(topic.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="p-3 bg-white border border-gray-200 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl transition-all shadow-sm"
                      title="Ver e Responder"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Criar Tópico Admin */}
      {isCreating && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter">Criar Tópico Oficial</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={20} className="text-gray-300" />
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Título do Tópico</label>
                <input 
                  required 
                  value={newTopicData.title}
                  onChange={e => setNewTopicData({...newTopicData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:border-brand-purple outline-none"
                  placeholder="Ex: Boas-vindas à nova turma!"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Categoria</label>
                <select 
                  value={newTopicData.category}
                  onChange={e => setNewTopicData({...newTopicData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:border-brand-purple outline-none"
                >
                  <option>Avisos Oficiais</option>
                  <option>Materiais Novos</option>
                  <option>Dúvidas Gerais</option>
                  <option>Pesquisa</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Mensagem Inicial</label>
                <textarea 
                  required 
                  rows={4}
                  value={newTopicData.content}
                  onChange={e => setNewTopicData({...newTopicData, content: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm focus:border-brand-purple outline-none resize-none"
                  placeholder="Escreva o conteúdo do tópico..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-brand-orange mb-2 flex items-center gap-2 cursor-pointer">
                  <BarChart2 size={14} /> Adicionar Enquete (Opcional)
                </label>
                <input value={newTopicData.question} onChange={e => setNewTopicData({...newTopicData, question: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-orange font-bold text-sm mb-3" placeholder="Pergunta da enquete..." />
                
                {newTopicData.question && (
                  <div className="space-y-2 pl-4 border-l-2 border-brand-orange/20">
                    {newTopicData.options.map((opt, idx) => (
                      <input key={idx} value={opt} onChange={e => updateOption(idx, e.target.value)} className="w-full px-4 py-2 bg-white rounded-lg border border-gray-200 outline-none text-xs font-medium" placeholder={`Opção ${idx + 1}`} />
                    ))}
                    <button type="button" onClick={addOption} className="text-[10px] font-black text-brand-purple uppercase hover:underline">+ Adicionar Opção</button>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={sending}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-black shadow-xl hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="animate-spin" /> : 'PUBLICAR COMO ADMIN'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
