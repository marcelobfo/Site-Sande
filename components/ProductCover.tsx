
import React, { useState } from 'react';
import { Package, Sparkles } from 'lucide-react';

interface ProductCoverProps {
  src?: string;
  alt: string;
  className?: string;
  category?: string;
}

export const ProductCover: React.FC<ProductCoverProps> = ({ src, alt, className = "", category }) => {
  const [error, setError] = useState(false);

  // Se tiver URL e não deu erro, tenta renderizar a imagem
  if (src && !error) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onError={() => setError(true)} 
        loading="lazy"
      />
    );
  }

  // Fallback: Capa Gerada Automaticamente
  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-brand-purple to-brand-dark relative overflow-hidden group ${className}`}>
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-orange/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
      
      {/* Ícone Central */}
      <div className="bg-white/10 p-3 md:p-4 rounded-2xl mb-3 backdrop-blur-md shadow-lg border border-white/10 relative z-10 group-hover:scale-110 transition-transform duration-500">
        <Package className="text-white" size={28} />
      </div>
      
      {/* Título do Produto */}
      <span className="text-white font-black uppercase tracking-tight text-xs md:text-sm lg:text-base line-clamp-3 leading-tight relative z-10 px-2 drop-shadow-md">
        {alt}
      </span>
      
      {/* Categoria (Badge) */}
      {category && (
        <span className="mt-3 text-[9px] text-brand-lilac uppercase tracking-widest font-black border border-brand-lilac/30 bg-brand-dark/30 px-3 py-1 rounded-full relative z-10">
          {category}
        </span>
      )}

      {/* Brilho no Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};
