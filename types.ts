
export interface Product {
  id: string;
  title: string;
  price: number;
  old_price?: number;
  description: string;
  category: string;
  image_url: string;
  checkout_url?: string;
  features?: string[];
  created_at?: string;
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
  homeheroimageurl?: string;
  homeherobgimageurl?: string;
  homemethodimageurl?: string;
  // Clube de Assinatura
  clubetitle?: string;
  clubedescription?: string;
  clubeprice: number;
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
  asaasapikey?: string;
  asaasissandbox?: boolean;
}

export type LeadStatus = 'Novo' | 'Em Contato' | 'Negociação' | 'Fechado' | 'Perdido';

export interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  subject: string;
  message: string;
  status: LeadStatus;
  created_at: string;
}

export type View = 'home' | 'about' | 'products' | 'product-detail' | 'blog' | 'blog-post' | 'contact' | 'faq' | 'policies' | 'admin' | 'briefing' | 'thank-you';
