
import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Eye, ArrowLeft, Loader2, User, Calendar } from 'lucide-react';
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

  const fetchPosts = async (topicId: string) => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (data) setPosts(data);
    setLoadingPosts(false);
  };

  const handleSelectTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    fetchPosts(topic.id);
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

  return (
    <div className="space-y-6">
      {selectedTopic ? (
        // VISÃO DETALHADA DO TÓPICO (MENSAGENS)
        <div className="animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setSelectedTopic(null)} 
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">{selectedTopic.title}</h3>
              <p className="text-xs text-gray-400 font-bold">Autor: {selectedTopic.author_name}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h4 className="font-black text-brand-dark text-sm uppercase">Mensagens ({posts.length})</h4>
                <button 
                  onClick={() => handleDeleteTopic(selectedTopic.id)}
                  className="text-red-500 text-[10px] font-black uppercase hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Excluir Tópico Inteiro
                </button>
             </div>
             
             <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loadingPosts ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-purple" /></div>
                ) : posts.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">Nenhuma mensagem neste tópico.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="flex gap-4 group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${post.is_admin ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {post.author_name[0].toUpperCase()}
                      </div>
                      <div className="flex-grow">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-brand-dark text-sm">{post.author_name}</span>
                            <span className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleString()}</span>
                            {post.is_admin && <span className="text-[9px] bg-brand-orange/10 text-brand-orange px-1.5 rounded font-black">ADMIN</span>}
                         </div>
                         <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 text-gray-600 text-sm">
                            {post.content}
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all self-start"
                        title="Excluir Mensagem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      ) : (
        // LISTAGEM DE TÓPICOS
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30">
             <h3 className="text-lg font-black text-brand-dark uppercase tracking-wide flex items-center gap-2">
               <MessageSquare className="text-brand-purple" size={20} /> Tópicos Ativos
             </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {topics.length === 0 ? (
              <div className="p-10 text-center text-gray-400">Nenhum tópico criado ainda.</div>
            ) : (
              topics.map(topic => (
                <div key={topic.id} className="p-6 hover:bg-gray-50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-lilac/10 p-3 rounded-2xl text-brand-purple">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                       <h4 className="font-bold text-brand-dark text-sm mb-1">{topic.title}</h4>
                       <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{topic.category}</span>
                          <span className="flex items-center gap-1"><User size={12}/> {topic.author_name}</span>
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(topic.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleSelectTopic(topic)}
                      className="p-3 bg-white border border-gray-200 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl transition-all shadow-sm"
                      title="Ver Mensagens"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-3 bg-white border border-gray-200 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                      title="Excluir Tópico"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
