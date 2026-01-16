
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Blog } from './pages/Blog';
import { BlogPostView } from './pages/BlogPostView';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Policies } from './pages/Policies';
import { Admin } from './pages/Admin';
import { Briefing } from './pages/Briefing';
import { ThankYou } from './pages/ThankYou';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { View, SiteContent } from './types';
import { supabase } from './lib/supabase';

const DEFAULT_CONTENT: SiteContent = {
  homeherotitle: 'Inspire. Inove. Protagonize.',
  homeherosub: 'Descubra o poder de transformar suas aulas com criatividade, metodologias ativas e um toque de propósito.',
  clubetitle: 'Clube Professora Protagonista',
  clubedescription: 'O clube de assinatura definitivo para professoras que buscam inovar sem perder tempo com planejamentos exaustivos.',
  clubeprice: 397,
  supportwhatsapp: '5533999872505',
  supportemail: 'contato@metodoprotagonizar.com.br',
  asaas_use_sandbox: true
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        
        if (data && !error) {
          setContent(data);
          if (data.faviconurl) {
            const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (favicon) favicon.href = data.faviconurl;
          }

          // Injetar Scripts de Tracking se existirem
          if (data.google_analytics_id) {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_analytics_id}`;
            document.head.appendChild(gaScript);

            const gaConfig = document.createElement('script');
            gaConfig.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${data.google_analytics_id}');
            `;
            document.head.appendChild(gaConfig);
          }

          if (data.meta_pixel_id) {
            const pixelScript = document.createElement('script');
            pixelScript.innerHTML = `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${data.meta_pixel_id}');
              fbq('track', 'PageView');
            `;
            document.head.appendChild(pixelScript);

            const pixelNoScript = document.createElement('noscript');
            pixelNoScript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${data.meta_pixel_id}&ev=PageView&noscript=1" />`;
            document.body.appendChild(pixelNoScript);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    };

    fetchContent();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const [view, id] = hash.split('/');
      const validViews: View[] = ['home', 'about', 'products', 'product-detail', 'blog', 'blog-post', 'contact', 'faq', 'policies', 'admin', 'briefing', 'thank-you'];
      
      if (validViews.includes(view as View)) {
        setCurrentView(view as View);
        setSelectedId(id || null);
        window.scrollTo(0, 0);
      } else if (!hash) {
        setCurrentView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleUpdateContent = async (newContent: SiteContent) => {
    setContent(newContent);
    const { created_at, updated_at, ...allFields } = newContent as any;
    
    const { error } = await supabase
        .from('site_content')
        .upsert({ ...allFields, id: 1 }, { onConflict: 'id' });
    
    if (error) {
      alert(`Erro ao salvar: ${error.message}`);
      throw error;
    }
  };

  const navigate = (v: View, id?: string) => { 
    window.location.hash = id ? `${v}/${id}` : v; 
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home onNavigate={navigate} content={content} />;
      case 'about': return <About onNavigate={navigate} content={content} />;
      case 'products': return <Products onNavigate={navigate} content={content} />;
      case 'product-detail': return <ProductDetail productId={selectedId} onNavigate={navigate} content={content} />;
      case 'blog': return <Blog onNavigate={navigate} />;
      case 'blog-post': return <BlogPostView postId={selectedId} onNavigate={navigate} />;
      case 'contact': return <Contact content={content} />;
      case 'faq': return <FAQ onNavigate={navigate} />;
      case 'policies': return <Policies onNavigate={navigate} />;
      case 'admin': return <Admin content={content} onUpdate={handleUpdateContent} />;
      case 'briefing': return <Briefing onNavigate={navigate} />;
      case 'thank-you': return <ThankYou onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} content={content} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentView={currentView} onNavigate={navigate} content={content} />
      <main className="flex-grow">{renderView()}</main>
      <Footer onNavigate={navigate} content={content} />
      <CookieConsent onNavigate={navigate} />
      <a
        href={`https://wa.me/${content.supportwhatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center border-4 border-white"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
};

export default App;
