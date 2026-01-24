
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, Share2, Loader2, Quote, ArrowRight } from 'lucide-react';
import { BlogPost, View } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

interface BlogPostViewProps {
  postId: string | null;
  onNavigate: (view: View, id?: string) => void;
}

// Fixed: Explicitly typed as React.FC<BlogPostViewProps> to resolve IntrinsicAttributes error in App.tsx
export const BlogPostView: React.FC<BlogPostViewProps> = ({ postId, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      onNavigate('blog');
      return;
    }

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (data && !error) setPost(data);
      else onNavigate('blog');
      setLoading(false);
    };
    fetchPost();
  }, [postId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-purple" size={64} /></div>;
  if (!post) return null;

  return (
    <div className="bg-brand-cream/30 pb-32">
      <SEO 
        title={post.title} 
        description={post.content.substring(0, 160) + '...'} 
        image={post.image_url} 
        type="article"
      />

      <article className="max-w-4xl mx-auto px-4 pt-12">
        <button onClick={() => onNavigate('blog')} className="flex items-center gap-2 text-brand-purple font-black mb-12 hover:gap-4 transition-all">
          <ArrowLeft size={20} /> VOLTAR PARA O BLOG
        </button>

        <div className="mb-12 text-center">
          <div className="bg-brand-orange text-white px-5 py-1.5 rounded-full inline-block text-[10px] font-black uppercase tracking-widest mb-8">
            {post.category}
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-brand-dark mb-10 leading-tight tracking-tighter">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-8 text-[11px] font-black text-gray-400 uppercase tracking-widest border-y border-brand-lilac/20 py-6">
            <span className="flex items-center gap-2"><Calendar size={16} className="text-brand-purple" /> {new Date(post.publish_date).toLocaleDateString('pt-BR')}</span>
            <span className="flex items-center gap-2"><User size={16} className="text-brand-purple" /> {post.author}</span>
            <button className="flex items-center gap-2 hover:text-brand-orange transition-colors"><Share2 size={16} /> Compartilhar</button>
          </div>
        </div>

        <div className="relative mb-20">
          <img src={post.image_url} className="w-full rounded-[4rem] shadow-3xl object-cover aspect-video" alt={post.title} />
          <div className="absolute -bottom-8 -left-8 bg-brand-purple text-white p-8 rounded-[2.5rem] shadow-3xl">
            <Quote size={40} fill="currentColor" />
          </div>
        </div>

        <div className="prose prose-2xl prose-purple max-w-none text-gray-700 font-medium leading-[1.8]">
          {(post.content || '').split('\n').map((para, i) => (
            para.trim() ? <p key={i} className="mb-8">{para}</p> : <br key={i} />
          ))}
        </div>

        <div className="mt-24 p-12 bg-brand-dark rounded-[4rem] text-white flex flex-col md:flex-row items-center gap-12">
          <div className="w-32 h-32 bg-brand-orange rounded-full shrink-0 flex items-center justify-center text-5xl font-black">S</div>
          <div>
            <h4 className="text-2xl font-black mb-4">Sobre a Autora</h4>
            <p className="text-gray-400 text-lg font-medium leading-relaxed mb-6">
              Sande Almeida é professora, especialista em Metodologias Ativas e criadora do Método Protagonizar. Já capacitou mais de 7.000 educadores em todo o Brasil.
            </p>
            <button 
              onClick={() => onNavigate('about')}
              className="text-brand-orange font-black flex items-center gap-2 hover:gap-4 transition-all"
            >
              CONHECER MINHA HISTÓRIA <ArrowRight />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
