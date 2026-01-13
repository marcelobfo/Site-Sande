
import React from 'react';
import { Target, Eye, Heart, Award, Sparkles, Trophy, Medal, MessageCircle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { View, SiteContent } from '../types';

interface AboutProps {
  onNavigate: (view: View) => void;
  content: SiteContent;
}

export const About: React.FC<AboutProps> = ({ onNavigate, content }) => {
  const featuredImages = [
    content.aboutfeaturedimage1,
    content.aboutfeaturedimage2,
    content.aboutfeaturedimage3
  ].filter(img => !!img);

  return (
    <div className="pb-32 bg-white overflow-x-hidden">
      {/* Page Header */}
      <section className="pt-24 pb-48 bg-brand-dark text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-purple/10 -skew-x-12 transform translate-x-1/4"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl lg:text-[8rem] font-black italic tracking-tighter uppercase leading-none mb-4 opacity-10 select-none">HISTÓRIA</h1>
          <h2 className="text-5xl lg:text-8xl font-black tracking-tighter uppercase leading-none -mt-16">
            Sobre <span className="text-brand-orange">Nós</span>
          </h2>
        </div>
      </section>

      {/* Main Content & Trajectory */}
      <section className="max-w-7xl mx-auto px-4 -mt-32 relative z-20">
        <div className="bg-white p-12 lg:p-24 rounded-[4rem] shadow-3xl border border-brand-lilac/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <div className="relative group">
                <div className="absolute -inset-4 bg-brand-purple/10 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src={content.abouttrajectoryimageurl || "https://metodoprotagonizar.com.br/wp-content/uploads/2024/05/Sande-Almeida-Hero.png"} 
                  className="relative rounded-[3.5rem] shadow-2xl border-8 border-white object-cover aspect-square" 
                  alt="Sande Almeida" 
                />
                <div className="absolute -bottom-10 -left-10 bg-brand-orange text-white p-8 rounded-[2.5rem] shadow-3xl flex flex-col items-center rotate-3">
                  <Award size={48} className="mb-2" />
                  <span className="text-2xl font-black italic">PROTAGONISTA</span>
                </div>
             </div>
             <div className="space-y-10">
                <div className="w-20 h-2 bg-brand-orange rounded-full"></div>
                <h3 className="text-4xl lg:text-5xl font-black text-brand-dark tracking-tighter uppercase leading-[0.9]">
                  Lax Serviços Educacionais & <span className="text-brand-purple">Sande Almeida</span>
                </h3>
                <div className="space-y-6 text-xl text-gray-500 font-medium leading-relaxed">
                  <p>
                    {content.abouttext || "A Lax Serviços Educacionais é a face da professora Sande Almeida. Apaixonada pela educação, graduada em Letras Português e pós-graduada em Metodologias Ativas e Educação Empreendedora."}
                  </p>
                  <p>
                    Como reconhecimento do seu trabalho, ganhou os prêmios Professores do Brasil em 2018 e o Prêmio Educação Empreendedora do Sebrae Minas. É a criadora do Método Protagonizar que já capacitou mais de 7.000 educadores.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-3 bg-brand-cream px-6 py-4 rounded-2xl border border-brand-orange/10">
                      <Trophy size={24} className="text-brand-orange" />
                      <span className="font-black text-brand-dark uppercase text-xs">Prêmio Professores do Brasil</span>
                   </div>
                   <div className="flex items-center gap-3 bg-brand-cream px-6 py-4 rounded-2xl border border-brand-orange/10">
                      <Medal size={24} className="text-brand-orange" />
                      <span className="font-black text-brand-dark uppercase text-xs">Sebrae Minas 2018</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-32 bg-brand-cream/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
              <h4 className="text-brand-orange font-black text-xs uppercase tracking-[0.2em] mb-4">Diferenciais</h4>
              <h2 className="text-5xl lg:text-6xl font-black text-brand-dark uppercase tracking-tighter leading-none">
                O que nos torna <br/><span className="text-brand-purple italic">Exclusivos</span>
              </h2>
            </div>
            <button onClick={() => onNavigate('contact')} className="bg-brand-pink text-white px-10 py-5 rounded-2xl font-black shadow-xl flex items-center gap-3 hover:scale-105 transition-all">
              FALE CONOSCO <ArrowRight />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Zap />, title: "Aplicação Imediata", desc: "Você sai da aula pronto para aplicar as ideias no dia seguinte." },
              { icon: <CheckCircle2 />, title: "Método Acessível", desc: "Propostas prontas que não exigem recursos complexos ou caros." },
              { icon: <Sparkles />, title: "Custo-Benefício", desc: "Materiais exclusivos com condições que respeitam a realidade do professor." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-brand-lilac/5 group hover:bg-brand-purple transition-all duration-500">
                <div className="w-20 h-20 bg-brand-lilac/10 rounded-3xl flex items-center justify-center text-brand-purple mb-8 group-hover:bg-white/10 group-hover:text-white transition-all">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 40 })}
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-4 group-hover:text-white uppercase tracking-tight">{item.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed group-hover:text-purple-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Vision Values Cards */}
      <section className="max-w-7xl mx-auto px-4 py-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
           <div className="bg-white border-2 border-dashed border-brand-lilac/30 p-12 rounded-[4rem] text-center space-y-6">
              <div className="w-20 h-20 bg-brand-lilac/10 rounded-full flex items-center justify-center mx-auto text-brand-purple">
                <Target size={40} />
              </div>
              <h3 className="text-3xl font-black text-brand-dark uppercase italic">Missão</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Incentivamos o protagonismo docente a partir da evolução da própria prática. Tornamos a sala de aula um espaço criativo e dinâmico.</p>
           </div>
           
           <div className="bg-white border-2 border-dashed border-brand-lilac/30 p-12 rounded-[4rem] text-center space-y-6">
              <div className="w-20 h-20 bg-brand-lilac/10 rounded-full flex items-center justify-center mx-auto text-brand-purple">
                <Eye size={40} />
              </div>
              <h3 className="text-3xl font-black text-brand-dark uppercase italic">Visão</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Almejamos ser referência nacional na formação de professores criativos. Nosso foco é inspirar uma nova geração de educadores.</p>
           </div>
           
           <div className="bg-white border-2 border-dashed border-brand-lilac/30 p-12 rounded-[4rem] text-center space-y-6">
              <div className="w-20 h-20 bg-brand-lilac/10 rounded-full flex items-center justify-center mx-auto text-brand-purple">
                <Heart size={40} />
              </div>
              <h3 className="text-3xl font-black text-brand-dark uppercase italic">Valores</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Acreditamos no protagonismo para transformar a educação. Unimos criatividade, inovação e afeto com autenticidade.</p>
           </div>
        </div>
      </section>

      {/* Gallery Section */}
      {featuredImages.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredImages.map((img, i) => (
              <div key={i} className="group overflow-hidden rounded-[3.5rem] shadow-2xl aspect-square border-8 border-white">
                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
