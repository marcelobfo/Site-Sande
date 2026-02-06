
import React, { useRef, useEffect } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  type?: 'youtube' | 'panda_embed' | 'panda_hls';
  title?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, type, title, className = "w-full h-full" }) => {
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
        className={`bg-black object-contain ${className}`}
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

  return (
    <iframe 
      src={embedUrl} 
      className={className} 
      title={title || "Video Player"}
      frameBorder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowFullScreen
    ></iframe>
  );
};
