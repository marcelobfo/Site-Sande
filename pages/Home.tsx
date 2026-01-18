
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
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: prods } = await supabase.from('products').select('*').limit(3).order('created_at', { ascending: false });
      if (prods) setFeaturedProducts(prods);
      
      const { data: posts } = await supabase.from('blog_posts').select('*').limit(3).order('publish_date', { ascending: false });
      if (posts) setRecentPosts(posts);
    };
    fetchData();
  }, []);

  const heroImageUrl = content.homeheroimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Sande-Almeida-Hero.png";

  return (
    <div className="pb-20 md:pb-32 overflow-x-hidden">
      {/* Dynamic Style for Hero Title size on Desktop */}
      <style>{`
        @media (min-width: 1280px) {
          .hero-dynamic-title {
            font-size: ${content.homeherotitlesize || 6.5}rem !important;
          }
        }
      `}</style>

      {/* Hero Section - Optimized for all screens */}
      <section className="relative min-h-[90vh] lg:min-h-[85vh] xl:min-h-[80vh] flex flex-col justify-end bg-brand-dark overflow-hidden px-4 pt-10 md:pt-16">
        <div className="absolute top-10 left-10 text-brand-pink/20 animate-pulse hidden md:block">
           <svg width="150" height="30" viewBox="0 0 100 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 10L10 0L20 10L30 0L40 10L50 0L60 10L70 0L80 10L90 0L100 10" stroke="currentColor" strokeWidth="3"/>
           </svg>
        </div>
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 items-end gap-0 md:gap-8 relative z-10 h-full">
          {/* Text Column */}
          <div className="text-white space-y-6 md:space-y-8 lg:space-y-10 pb-12 md:pb-16 lg:pb-24 xl:pb-32 text-center lg:text-left self-center z-30">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/5 mx-auto lg:mx-0">
              <Sparkles size={14} className="text-brand-orange" /> Método Protagonizar
            </div>
            
            <h1 className="hero-dynamic-title text-[2.6rem] sm:text-5xl md:text-6xl lg:text-5xl xl:text-[5.5rem] 2xl:text-[6.5rem] font-black leading-[0.9] xl:leading-[0.95] tracking-tighter uppercase italic break-words">
              Inspire.<br className="block"/>Inove.<br className="block"/>
              {/* Ajuste: Tamanho relativo (0.75em) para garantir que a palavra maior caiba na linha */}
              <span className="text-brand-orange not-italic whitespace-nowrap text-[0.75em] block leading-[1.1]">Protagonize.</span>
            </h1>
            
            <p className="text-sm md:text-lg lg:text-xl xl:text-2xl font-medium text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0 px-4 md:px-0">
              {content.homeherosub || 'Aprenda a utilizar Metodologias Ativas em suas aulas e conquiste mais resultados com os alunos.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center lg:justify-start px-8 md:px-0 pt-2">
              <button onClick={() => onNavigate('products')} className="bg-brand-orange text-white px-8 py-5 md:px-12 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-lg md:text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 w-full sm:w-fit group">
                COMEÇAR JORNADA <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

          {/* Image Column - Optimized for instant loading feel */}
          <div className="relative flex justify-center lg:justify-end items-end self-end w-full overflow-visible min-h-[300px] md:min-h-[500px]">
            {/* Background Effects */}
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-brand-dark to-transparent z-20 pointer-events-none md:hidden"></div>
            <div className="absolute bottom-0 right-0 lg:right-0 w-[110%] h-[80%] bg-brand-purple/20 rounded-t-full blur-[80px] -z-10"></div>
            
            {/* Loading Placeholder */}
            {!heroImageLoaded && (
              <div className="absolute inset-0 flex items-end justify-center lg:justify-end lg:translate-x-16 z-0">
                <div className="w-[80%] lg:w-[100%] aspect-[3/4] bg-brand-purple/10 rounded-t-[5rem] animate-pulse blur-sm"></div>
              </div>
            )}

            <img 
              src={heroImageUrl} 
              onLoad={() => setHeroImageLoaded(true)}
              className={`relative z-10 max-w-[120%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-none lg:w-[130%] h-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] block mb-0 lg:translate-x-16 origin-bottom transform-gpu align-bottom transition-opacity duration-700 ease-out ${heroImageLoaded ? 'opacity-100' : 'opacity-0'}`} 
              alt="Sande Almeida"
              fetchPriority="high"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 mt-16 md:mt-24 lg:mt-32">
        <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between mb-10 md:mb-16 gap-6 text-center lg:text-left">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-brand-dark leading-tight md:leading-none tracking-tighter uppercase mb-4 md:mb-6">Destaques da <br className="hidden md:block"/><span className="text-brand-purple italic">Vitrine</span></h2>
            <p className="text-lg md:text-xl text-gray-500 font-medium">Materiais didáticos criativos construídos com Metodologias Ativas.</p>
          </div>
          <button onClick={() => onNavigate('products')} className="w-full sm:w-auto bg-brand-lilac/10 text-brand-purple px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl font-black text-sm hover:bg-brand-purple hover:text-white transition-all shadow-sm">VER TODOS OS MATERIAIS</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {featuredProducts.map(product => (
            <div key={product.id} className="group bg-white rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] overflow-hidden shadow-xl border border-brand-lilac/5 hover:shadow-2xl transition-all cursor-pointer flex flex-col" onClick={() => onNavigate('product-detail', product.id)}>
              <div className="relative aspect-square overflow-hidden">
                <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.title} />
                <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-brand-purple/90 backdrop-blur-md text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                  {product.category}
                </div>
              </div>
              <div className="p-6 md:p-8 lg:p-10 flex-grow flex flex-col">
                <h3 className="text-xl md:text-2xl font-black text-brand-dark mb-3 md:mb-4 leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">{product.title}</h3>
                <div className="flex items-baseline gap-2 mb-6 md:mb-8 lg:mb-10">
                  <span className="text-2xl md:text-3xl font-black text-brand-purple">R$ {Number(product.price).toFixed(2)}</span>
                  {product.old_price && <span className="text-gray-300 line-through text-xs md:text-sm font-bold">R$ {Number(product.old_price).toFixed(2)}</span>}
                </div>
                <button className="mt-auto w-full bg-gray-50 text-brand-purple py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-sm group-hover:bg-brand-purple group-hover:text-white transition-all flex items-center justify-center gap-2">
                  VER DETALHES <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clube CTA */}
      <section className="max-w-7xl mx-auto px-4 mt-16 md:mt-24 lg:mt-32">
        <div className="bg-brand-purple rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] p-8 md:p-12 lg:p-20 text-white text-center relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 md:-mr-48 md:-mt-48"></div>
          
          <div className="relative z-10 space-y-6 md:space-y-10 lg:space-y-12">
            <div className="bg-brand-orange text-white w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <Gem size={32} className="md:size-[40px]" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-[5rem] font-black leading-[1.1] xl:leading-[0.85] tracking-tighter uppercase italic">
                O Arsenal Completo <br className="hidden md:block"/>
                <span className="text-brand-orange not-italic text-xl md:text-3xl lg:text-[4rem]">da Professora</span>
              </h2>
              <p className="text-brand-lilac font-black text-xs md:text-xl lg:text-2xl uppercase tracking-widest">Acesso Ilimitado • Atualizações Semanais</p>
            </div>

            <p className="text-base md:text-lg lg:text-2xl text-purple-100 font-medium max-w-4xl mx-auto leading-relaxed">
              Não compre apenas um material, garanta o <span className="text-white font-black underline decoration-brand-orange underline-offset-8">Acesso Total!</span> Libere instantaneamente toda a nossa biblioteca.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {[
                { icon: <CheckCircle2 className="text-brand-orange" />, text: "Biblioteca Completa" },
                { icon: <Zap className="text-brand-orange" />, text: "Novidades Semanais" },
                { icon: <ShieldCheck className="text-brand-orange" />, text: "Suporte VIP" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="font-black text-[9px] md:text-xs uppercase tracking-tight text-left">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-6">
               <button onClick={() => onNavigate('products')} className="w-full sm:w-auto bg-brand-orange text-white px-8 py-5 md:px-12 md:py-6 lg:px-16 lg:py-8 rounded-xl md:rounded-[2.5rem] font-black text-lg md:text-xl lg:text-2xl xl:text-3xl shadow-3xl hover:scale-105 transition-all hover:bg-white hover:text-brand-purple group">
                  QUERO ACESSO ILIMITADO
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="bg-brand-cream/50 py-16 md:py-24 lg:py-32 mt-16 md:mt-24 lg:mt-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16 lg:mb-20 space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-brand-dark uppercase tracking-tighter">Nosso Blog de <span className="text-brand-orange italic">Inovação</span></h2>
            <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto">Estratégias práticas para o dia a dia docente.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {recentPosts.map(post => (
              <article key={post.id} className="group cursor-pointer" onClick={() => onNavigate('blog-post', post.id)}>
                <div className="relative aspect-video rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden mb-6 md:mb-8 shadow-lg">
                  <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-brand-dark px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {post.category}
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4 px-2">
                  <div className="flex items-center gap-4 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-brand-purple" /> {new Date(post.publish_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-brand-dark leading-tight group-hover:text-brand-purple transition-colors line-clamp-2">{post.title}</h3>
                  <div className="flex items-center gap-2 text-brand-orange font-black text-[10px] md:text-xs uppercase tracking-widest pt-1">
                    Ler Artigo <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
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
