
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Send, User, Clock, ArrowLeft, Loader2, BarChart2, X, Check, ThumbsUp, Trash2 } from 'lucide-react';
import { View, ForumTopic, ForumPost, ForumPoll } from '../types';
import { supabase } from '../lib/supabase';

interface ForumProps {
  onNavigate: (view: View, id?: string) => void;
  user: any;
}

export const Forum: React.FC<ForumProps> = ({ onNavigate, user }) => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicData, setNewTopicData] = useState({ title: '', category: 'Geral', question: '', options: ['', ''] });
  const [poll, setPoll] = useState<any>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTopics();
    
    const subscription = supabase
      .channel('public:forum_topics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_topics' }, payload => {
        setTopics(current => [payload.new as ForumTopic, ...current]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic.id);
      fetchPoll(selectedTopic.id);

      const postSub = supabase
        .channel(`topic:${selectedTopic.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_posts', filter: `topic_id=eq.${selectedTopic.id}` }, payload => {
          setPosts(current => [...current, payload.new as ForumPost]);
          scrollToBottom();
        })
        .subscribe();

      return () => { supabase.removeChannel(postSub); };
    }
  }, [selectedTopic]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTopics = async () => {
    const { data } = await supabase.from('forum_topics').select('*').order('created_at', { ascending: false });
    if (data) setTopics(data);
    setLoading(false);
  };

  const fetchPosts = async (topicId: string) => {
    const { data } = await supabase.from('forum_posts').select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
    if (data) {
      setPosts(data);
      setTimeout(scrollToBottom, 100);
    }
  };

  const fetchPoll = async (topicId: string) => {
    const { data: pollData } = await supabase.from('forum_polls').select('*, forum_poll_options(*), forum_poll_votes(*)').eq('topic_id', topicId).single();
    
    if (pollData) {
      setPoll(pollData);
      const myVote = pollData.forum_poll_votes.find((v: any) => v.user_email === user.email);
      if (myVote) setUserVote(myVote.option_id);
    } else {
      setPoll(null);
      setUserVote(null);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // 1. Criar Tópico
      const { data: topic, error } = await supabase.from('forum_topics').insert([{
        title: newTopicData.title,
        category: newTopicData.category,
        author_name: user.email.split('@')[0], // Nome simples baseado no email
        author_email: user.email,
      }]).select().single();

      if (error) throw error;

      // 2. Criar Enquete (se houver pergunta)
      if (newTopicData.question && newTopicData.options.every(o => o.trim() !== '')) {
        const { data: poll } = await supabase.from('forum_polls').insert([{
          topic_id: topic.id,
          question: newTopicData.question
        }]).select().single();

        if (poll) {
          const optionsPayload = newTopicData.options.map(opt => ({
            poll_id: poll.id,
            option_text: opt
          }));
          await supabase.from('forum_poll_options').insert(optionsPayload);
        }
      }

      setIsCreatingTopic(false);
      setNewTopicData({ title: '', category: 'Geral', question: '', options: ['', ''] });
      // Realtime irá atualizar a lista
    } catch (err) {
      console.error(err);
      alert('Erro ao criar tópico.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !selectedTopic || !user) return;

    const isAdmin = user.user_metadata?.role === 'admin' || user.email === 'contato@metodoprotagonizar.com.br';

    await supabase.from('forum_posts').insert([{
      topic_id: selectedTopic.id,
      content: newPost,
      author_name: user.email.split('@')[0],
      author_email: user.email,
      is_admin: isAdmin
    }]);

    setNewPost('');
  };

  const handleVote = async (optionId: string) => {
    if (!poll || userVote) return;

    const { error } = await supabase.from('forum_poll_votes').insert([{
      poll_id: poll.id,
      option_id: optionId,
      user_email: user.email
    }]);

    if (!error) {
      setUserVote(optionId);
      fetchPoll(selectedTopic!.id); // Atualiza contagem
    }
  };

  // Funções Auxiliares para Enquete
  const addOption = () => setNewTopicData({...newTopicData, options: [...newTopicData.options, '']});
  const updateOption = (idx: number, val: string) => {
    const opts = [...newTopicData.options];
    opts[idx] = val;
    setNewTopicData({...newTopicData, options: opts});
  };

  if (!user) {
    onNavigate('login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-brand-dark text-white p-6 shadow-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('my-account')} className="p-2 hover:bg-white/10 rounded-full transition-all"><ArrowLeft /></button>
            <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="text-brand-orange" /> Comunidade VIP
            </h1>
          </div>
          {!selectedTopic && (
            <button onClick={() => setIsCreatingTopic(true)} className="bg-brand-orange px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-brand-orange transition-all flex items-center gap-2">
              <Plus size={16} /> Novo Tópico
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 flex gap-8 h-[calc(100vh-80px)]">
        
        {/* Sidebar Topics List (Desktop) or Full View (Mobile if no topic selected) */}
        <div className={`w-full md:w-1/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden ${selectedTopic ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-black text-brand-dark uppercase tracking-widest text-xs">Discussões Recentes</h2>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
            {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-purple" /></div> : 
             topics.map(topic => (
              <div 
                key={topic.id} 
                onClick={() => setSelectedTopic(topic)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${selectedTopic?.id === topic.id ? 'bg-brand-purple/5 border-brand-purple shadow-sm' : 'bg-white border-gray-100 hover:border-brand-purple/30 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">{topic.category}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{new Date(topic.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-brand-dark text-sm mb-1 line-clamp-2">{topic.title}</h3>
                <p className="text-xs text-gray-400 font-medium">Por: {topic.author_name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative ${!selectedTopic ? 'hidden md:flex justify-center items-center' : 'flex'}`}>
          {selectedTopic ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h2 className="font-black text-lg text-brand-dark leading-tight">{selectedTopic.title}</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Iniciado por <span className="font-bold text-brand-purple">{selectedTopic.author_name}</span></p>
                </div>
                <button onClick={() => setSelectedTopic(null)} className="md:hidden p-2 text-gray-400"><X /></button>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-50">
                
                {/* Enquete (Se houver) */}
                {poll && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand-lilac/20 mb-8 max-w-lg mx-auto">
                    <h4 className="font-black text-brand-dark mb-4 flex items-center gap-2">
                      <BarChart2 className="text-brand-orange" size={20} /> {poll.question}
                    </h4>
                    <div className="space-y-3">
                      {poll.forum_poll_options.map((opt: any) => {
                        const votes = poll.forum_poll_votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                        const totalVotes = poll.forum_poll_votes?.length || 0;
                        const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                        const isSelected = userVote === opt.id;

                        return (
                          <button 
                            key={opt.id}
                            disabled={!!userVote}
                            onClick={() => handleVote(opt.id)}
                            className={`w-full relative h-12 rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-brand-purple ring-2 ring-brand-purple/20' : 'border-gray-200 hover:border-brand-purple/50'}`}
                          >
                            <div className={`absolute top-0 left-0 h-full ${isSelected ? 'bg-brand-purple/10' : 'bg-gray-100'} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                            <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                              <span className={`text-xs font-bold ${isSelected ? 'text-brand-purple' : 'text-gray-600'}`}>{opt.option_text}</span>
                              {userVote && <span className="text-xs font-black text-gray-400">{Math.round(percent)}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">
                      {userVote ? 'Voto Computado' : 'Vote para ver os resultados'}
                    </p>
                  </div>
                )}

                {/* Posts */}
                {posts.map(post => (
                  <div key={post.id} className={`flex gap-4 ${post.author_email === user.email ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${post.is_admin ? 'bg-brand-orange text-white' : 'bg-brand-lilac/30 text-brand-purple'}`}>
                      {post.author_name[0].toUpperCase()}
                    </div>
                    <div className={`max-w-[80%] space-y-1 ${post.author_email === user.email ? 'items-end flex flex-col' : ''}`}>
                      <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${post.is_admin ? 'bg-brand-orange/10 border border-brand-orange/20 text-brand-dark' : post.author_email === user.email ? 'bg-brand-purple text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                        {post.content}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold px-1">
                        {post.is_admin && <span className="text-brand-orange mr-2">★ ADMIN</span>}
                        {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10 font-medium transition-all"
                    placeholder="Digite sua mensagem..."
                  />
                  <button type="submit" disabled={!newPost.trim()} className="bg-brand-purple text-white p-4 rounded-2xl hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-400 uppercase">Selecione um Tópico</h3>
              <p className="text-gray-400 font-medium mt-2">Escolha uma discussão ao lado ou crie uma nova.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Criar Tópico */}
      {isCreatingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Criar Novo Tópico</h3>
              <button onClick={() => setIsCreatingTopic(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={20} className="text-gray-300"/></button>
            </div>
            
            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Título</label>
                <input required value={newTopicData.title} onChange={e => setNewTopicData({...newTopicData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-bold text-sm" placeholder="Ex: Dúvida sobre BNCC" />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Categoria</label>
                <select value={newTopicData.category} onChange={e => setNewTopicData({...newTopicData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-brand-purple font-bold text-sm">
                  <option>Geral</option>
                  <option>Dúvidas Pedagógicas</option>
                  <option>Sugestões</option>
                  <option>Networking</option>
                </select>
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

              <button type="submit" className="w-full bg-brand-purple text-white py-4 rounded-xl font-black shadow-xl hover:bg-brand-dark transition-all">
                PUBLICAR TÓPICO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
