
export interface ProductMaterial {
  id: string;
  title: string;
  type: 'video' | 'file' | 'link' | 'drive';
  url: string;
  video_type?: 'youtube' | 'panda_embed' | 'panda_hls'; // Novo campo
  duration?: string; 
  module?: string; 
}

export interface Product {
  id: string;
  title: string;
  price: number;
  old_price?: number;
  description: string;
  category: string;
  image_url: string;
  download_url?: string; 
  materials?: ProductMaterial[]; 
  featured_video_url?: string; 
  featured_video_type?: 'youtube' | 'panda_embed' | 'panda_hls'; // Novo campo
  checkout_url?: string;
  features?: string[];
  status?: 'published' | 'draft'; 
  payment_active?: boolean; 
  forum_active?: boolean; 
  created_at?: string;
}

export interface ProductForumMessage {
  id: string;
  product_id: string;
  user_email: string;
  user_name: string;
  content: string;
  created_at: string;
  reactions: Record<string, string[]>; 
  reply_to?: string;
}

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address: string;
  addressNumber: string;
  complement?: string;
  postalCode: string;
  province: string;
  city: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  publish_date: string;
  created_at?: string;
}

export interface SiteContent {
  homeherotitle: string;
  homeherosub: string;
  homeherotitlesize?: number; 
  homeheroimageurl?: string;
  homeherobgimageurl?: string;
  homemethodimageurl?: string;
  // Clube de Assinatura
  clubetitle?: string;
  clubedescription?: string;
  clubeprice: number;
  clubeoldprice?: number; // Novo: Preço riscado
  clubefeatures?: string; // Novo: Lista de benefícios
  clubebannerimageurl?: string;
  // Suporte
  supportwhatsapp: string;
  supportemail: string;
  logourl?: string;
  faviconurl?: string;
  abouttitle?: string;
  abouttext?: string;
  abouttrajectoryimageurl?: string;
  // Galeria Sobre
  aboutfeaturedimage1?: string;
  aboutfeaturedimage2?: string;
  aboutfeaturedimage3?: string;
  // Integração Asaas
  asaas_production_key?: string;
  asaas_sandbox_key?: string;
  asaas_use_sandbox?: boolean;
  asaas_backend_url?: string;
  // Marketing & Analytics
  google_analytics_id?: string;
  meta_pixel_id?: string;
  meta_api_token?: string;
}

export type LeadStatus = 'Novo' | 'Aguardando Pagamento' | 'Pago' | 'Cancelado' | 'Em Contato' | 'Fechado' | 'Perdido' | 'Aprovado';

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  subject: string;
  message: string;
  status: LeadStatus;
  product_id?: string;
  product_name?: string;
  value?: number;
  payment_id?: string;
  cpf_cnpj?: string;
  postal_code?: string;
  address?: string;
  address_number?: string;
  province?: string;
  city?: string;
  complement?: string;
  created_at: string;
}

// Forum Types (Global Forum)
export interface ForumTopic {
  id: string;
  title: string;
  author_name: string;
  author_email: string;
  category: string;
  created_at: string;
  likes: number;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  content: string;
  author_name: string;
  author_email: string;
  created_at: string;
  is_admin: boolean;
}

export interface ForumPollOption {
  id: string;
  poll_id: string;
  option_text: string;
}

export interface ForumPoll {
  id: string;
  topic_id: string;
  question: string;
  options?: ForumPollOption[];
}

export type View = 'home' | 'about' | 'products' | 'product-detail' | 'blog' | 'blog-post' | 'contact' | 'faq' | 'policies' | 'refund' | 'privacy' | 'admin' | 'briefing' | 'thank-you' | 'login' | 'my-account' | 'player' | 'forum';
