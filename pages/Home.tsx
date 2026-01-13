
import React, { useState, useEffect } from 'react';
import { Star, Zap, ArrowRight, Sparkles, Quote, Circle, CheckCircle2, ShoppingCart, Calendar, User, ArrowUpRight, ShieldCheck, Gem } from 'lucide-react';
import { View, SiteContent, Product, BlogPost } from '../types';
import { supabase } from '../lib/supabase';

interface HomeProps {
  onNavigate: (view: View, id?: string) => void;
  content: SiteContent;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, content }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: prods } = await supabase.from('products').select('*').limit(3).order('created_at', { ascending: false });
      if (prods) setFeaturedProducts(prods);
      
      const { data: posts } = await supabase.from('blog_posts').select('*').limit(3).order('publish_date', { ascending: false });
      if (posts) setRecentPosts(posts);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-32 pb-32 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-brand-dark overflow-hidden px-4 pt-20 lg:pt-32 pb-0">
        <div className="absolute top-10 left-10 text-brand-pink/20 animate-pulse">
           <svg width="150" height="30" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 10L10 0L20 10L30 0L40 10L50 0L60 10L70 0L80 10L90 0L100 10" stroke="currentColor" strokeWidth="3"/>
           </svg>
        </div>
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10 h-full">
          <div className="text-white space-y-10 pb-20 lg:pb-32">
            <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/5">
              <Sparkles size={16} className="text-brand-orange" /> Método Protagonizar
            </div>
            <h1 className="text-5xl lg:text-[5.8rem] font-black leading-[0.95] tracking-tighter uppercase italic">
              Inspire.<br/>Inove.<br/>
              <span className="text-brand-orange not-italic">Protagonize.</span>
            </h1>
            
            <p className="text-lg lg:text-2xl font-medium text-white/80 leading-relaxed max-w-xl">
              {content.homeherosub || 'Aprenda a utilizar Metodologias Ativas em suas aulas e conquiste mais resultados com os alunos, reduzindo o tempo de planejamento.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={() => onNavigate('products')} className="bg-brand-orange text-white px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 w-fit group">
                COMEÇAR JORNADA <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end self-end">
            <div className="absolute bottom-0 right-0 lg:right-0 w-[95%] h-[98%] bg-brand-purple/20 rounded-t-full blur-3xl"></div>
            <img 
              src={content.homeheroimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Sande-Almeida-Hero.png"} 
              className="relative z-20 max-w-full lg:max-w-none lg:w-[125%] h-auto drop-shadow-2xl block mb-0 lg:translate-x-16 origin-bottom" 
              alt="Sande Almeida" 
            />
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl lg:text-6xl font-black text-brand-dark leading-none tracking-tighter uppercase mb-6">Destaques da <br/><span className="text-brand-purple italic">Vitrine</span></h2>
            <p className="text-xl text-gray-500 font-medium">Materiais didáticos criativos construídos com Metodologias Ativas e Educação Empreendedora.</p>
          </div>
          <button onClick={() => onNavigate('products')} className="bg-brand-lilac/10 text-brand-purple px-10 py-5 rounded-2xl font-black text-sm hover:bg-brand-purple hover:text-white transition-all shadow-sm">VER TODOS OS MATERIAIS</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredProducts.map(product => (
            <div key={product.id} className="group bg-white rounded-[4rem] overflow-hidden shadow-xl border border-brand-lilac/5 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
              <div className="relative aspect-square overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                <div className="absolute top-8 left-8 bg-brand-purple/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {product.category}
                </div>
              </div>
              <div className="p-10 flex-grow flex flex-col">
                <h3 className="text-2xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-purple transition-colors">{product.title}</h3>
                <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                  {product.old_price && <span className="text-gray-300 line-through text-sm font-bold">R$ {Number(product.old_price).toFixed(2)}</span>}
                </div>
                <button className="mt-auto w-full bg-gray-50 text-brand-purple py-5 rounded-[1.5rem] font-black text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">
                  VER DETALHES <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clube CTA - NEW PERSUASIVE COPY */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-brand-purple rounded-[5rem] p-12 lg:p-24 text-white text-center relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-2xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10 space-y-12">
            <div className="bg-brand-orange text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <Gem size={40} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl lg:text-[5.5rem] font-black leading-[0.85] tracking-tighter uppercase italic">
                O Arsenal Completo <br/>
                <span className="text-brand-orange not-italic">da Professora</span>
              </h2>
              <p className="text-brand-lilac font-black text-2xl uppercase tracking-widest">Acesso Ilimitado • Atualizações Semanais</p>
            </div>

            <p className="text-xl lg:text-3xl text-purple-100 font-medium max-w-4xl mx-auto leading-relaxed">
              Não compre apenas um material, garanta o <span className="text-white font-black underline decoration-brand-orange underline-offset-8">Acesso Total!</span> Ao entrar no Clube Protagonista, você libera instantaneamente toda a nossa biblioteca de combos, dinâmicas e manuais, além de receber todas as atualizações e novos materiais sem pagar nada a mais por isso.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: <CheckCircle2 className="text-brand-orange" />, text: "Biblioteca Completa Liberada" },
                { icon: <Zap className="text-brand-orange" />, text: "Novos Materiais Toda Semana" },
                { icon: <ShieldCheck className="text-brand-orange" />, text: "Suporte VIP e Aulas Exclusivas" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 p-6 rounded-3xl border border-white/10">
                  {item.icon}
                  <span className="font-black text-xs uppercase tracking-tight text-left">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-6">
               <button onClick={() => onNavigate('products')} className="bg-brand-orange text-white px-16 py-8 rounded-[2.5rem] font-black text-2xl lg:text-3xl shadow-3xl hover:scale-105 transition-all hover:bg-white hover:text-brand-purple group">
                  QUERO ACESSO ILIMITADO AGORA
               </button>
               <div className="flex items-center gap-4 text-sm font-black text-purple-200 uppercase tracking-widest">
                  <Star fill="currentColor" size={16} /> Tudo o que você precisa para dar um show na sala de aula
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="bg-brand-cream/50 py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-5xl lg:text-6xl font-black text-brand-dark uppercase tracking-tighter">Nosso Blog de <span className="text-brand-orange italic">Inovação</span></h2>
            <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">Dicas e estratégias práticas para o dia a dia docente.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {recentPosts.map(post => (
              <article key={post.id} className="group cursor-pointer" onClick={() => onNavigate('blog-post', post.id)}>
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden mb-8 shadow-lg">
                  <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm text-brand-dark px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {post.category}
                  </div>
                </div>
                <div className="space-y-4 px-4">
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-purple" /> {new Date(post.publish_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black text-brand-dark leading-tight group-hover:text-brand-purple transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-2 text-brand-orange font-black text-xs uppercase tracking-widest pt-2">
                    Ler Artigo Completo <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
