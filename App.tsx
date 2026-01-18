
import React, { useState, useEffect, useCallback } from 'react';
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
import { RefundPolicy } from './pages/RefundPolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Admin } from './pages/Admin';
import { Briefing } from './pages/Briefing';
import { ThankYou } from './pages/ThankYou';
import { Login } from './pages/Login';
import { MyAccount } from './pages/MyAccount';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { Toaster, Notification, NotificationType } from './components/Notification';
import { View, SiteContent } from './types';
import { supabase } from './lib/supabase';

const DEFAULT_CONTENT: SiteContent = {
  homeherotitle: 'Inspire. Inove. Protagonize.',
  homeherosub: 'Descubra o poder de transformar suas aulas com criatividade, metodologias ativas e um toque de propósito.',
  homeherotitlesize: 6.5,
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
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const checkAdminStatus = (currentUser: any) => {
    if (!currentUser) return false;
    return (
      currentUser.user_metadata?.role === 'admin' || 
      currentUser.email === 'contato@metodoprotagonizar.com.br'
    );
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(checkAdminStatus(currentUser));
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(checkAdminStatus(currentUser));
    });

    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).maybeSingle();
        // Merge com DEFAULT_CONTENT garante que campos novos (como homeherotitlesize) tenham valor mesmo se não existirem no DB
        if (data && !error) setContent({ ...DEFAULT_CONTENT, ...data });
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      }
    };
    fetchContent();

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const [view, id] = hash.split('/');
      const validViews: View[] = ['home', 'about', 'products', 'product-detail', 'blog', 'blog-post', 'contact', 'faq', 'policies', 'refund', 'privacy', 'admin', 'briefing', 'thank-you', 'login', 'my-account'];
      
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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleUpdateContent = async (newContent: SiteContent) => {
    try {
      setContent(newContent);
      const { created_at, updated_at, ...allFields } = newContent as any;
      const { error } = await supabase.from('site_content').upsert({ ...allFields, id: 1 }, { onConflict: 'id' });
      if (error) throw error;
      addNotification('success', 'Sucesso!', 'Configurações do site atualizadas.');
    } catch (err: any) {
      if (err.message?.includes("homeherotitlesize")) {
        addNotification('error', 'Coluna Inexistente', 'Rode o script SQL no Supabase para criar a coluna "homeherotitlesize".');
      } else {
        addNotification('error', 'Erro ao salvar', err.message);
      }
      throw err;
    }
  };

  const navigate = (v: View, id?: string) => { 
    window.location.hash = id ? `${v}/${id}` : v; 
  };

  const renderView = () => {
    if (currentView === 'admin' && !isAdmin) return <Login onNavigate={navigate} type="admin" notify={addNotification} />;
    if (currentView === 'my-account' && !user) return <Login onNavigate={navigate} type="user" notify={addNotification} />;

    switch (currentView) {
      case 'home': return <Home onNavigate={navigate} content={content} />;
      case 'about': return <About onNavigate={navigate} content={content} />;
      case 'products': return <Products onNavigate={navigate} content={content} notify={addNotification} />;
      case 'product-detail': return <ProductDetail productId={selectedId} onNavigate={navigate} content={content} notify={addNotification} />;
      case 'blog': return <Blog onNavigate={navigate} />;
      case 'blog-post': return <BlogPostView postId={selectedId} onNavigate={navigate} />;
      case 'contact': return <Contact content={content} onNavigate={navigate} notify={addNotification} />;
      case 'faq': return <FAQ onNavigate={navigate} />;
      case 'policies': return <Policies onNavigate={navigate} />;
      case 'refund': return <RefundPolicy onNavigate={navigate} content={content} />;
      case 'privacy': return <PrivacyPolicy onNavigate={navigate} />;
      case 'admin': return <Admin content={content} onUpdate={handleUpdateContent} onNavigate={navigate} notify={addNotification} />;
      case 'briefing': return <Briefing onNavigate={navigate} />;
      case 'thank-you': return <ThankYou onNavigate={navigate} />;
      case 'login': return <Login onNavigate={navigate} notify={addNotification} />;
      case 'my-account': return <MyAccount onNavigate={navigate} user={user} />;
      default: return <Home onNavigate={navigate} content={content} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster notifications={notifications} removeNotification={removeNotification} />
      <Header currentView={currentView} onNavigate={navigate} content={content} user={user} isAdmin={isAdmin} />
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
