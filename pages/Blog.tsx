
import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, User, Search, Loader2 } from 'lucide-react';
import { View, BlogPost } from '../types';
import { supabase } from '../lib/supabase';

interface BlogProps {
  onNavigate: (view: View, id?: string) => void;
}

// Fixed: Explicitly typed as React.FC<BlogProps> to resolve IntrinsicAttributes error in App.tsx
export const Blog: React.FC<BlogProps> = ({ onNavigate }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('publish_date', { ascending: false });
      
      if (data && !error) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-brand-cream/20 pb-32">
      <section className="bg-brand-dark pt-24 pb-48 text-white text-center px-4 overflow-hidden relative">
        <div className="absolute bottom-0 left-0 w-full h-24 bg-brand-cream/20 skew-y-3 origin-bottom-left"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl lg:text-[4.5rem] font-black mb-8 leading-tight">Nosso Blog de <br/> <span className="text-brand-orange">Inovação</span></h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Insights práticos para professoras que querem transformar suas aulas em experiências protagonistas.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-3xl border border-brand-lilac/20 flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
          <div className="flex gap-4 overflow-x-auto w-full md:w-auto no-scrollbar py-2">
            {['Todos', 'Metodologias Ativas', 'Dicas Práticas', 'Inovação', 'IA na Educação'].map(c => (
              <button key={c} onClick={() => setSearchTerm(c === 'Todos' ? '' : c)} className="whitespace-nowrap px-6 py-2.5 rounded-xl font-black text-sm text-gray-400 hover:text-brand-purple hover:bg-brand-purple/5 transition-all">
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <input 
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-purple font-bold" 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-brand-purple" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredPosts.map(post => (
              <article 
                key={post.id} 
                className="group bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-brand-lilac/10 hover:shadow-2xl transition-all flex flex-col cursor-pointer"
                onClick={() => onNavigate('blog-post', post.id)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
                  <div className="absolute top-6 left-6 bg-brand-orange text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {post.category}
                  </div>
                </div>
                <div className="p-10 flex-grow flex flex-col">
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.publish_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
                  </div>
                  <h3 className="text-2xl font-black text-brand-dark mb-6 group-hover:text-brand-purple transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <button className="mt-auto flex items-center gap-2 text-brand-orange font-black text-sm group-hover:gap-4 transition-all">
                    CONTINUAR LENDO <ArrowRight size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
