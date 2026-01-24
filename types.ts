
export interface ProductMaterial {
  id: string;
  title: string;
  type: 'video' | 'file' | 'link' | 'drive';
  url: string;
  duration?: string; // Duração estimada
  module?: string; // Nome do Módulo (ex: Módulo 1: Introdução)
}

export interface Product {
  id: string;
  title: string;
  price: number;
  old_price?: number;
  description: string;
  category: string;
  image_url: string;
  download_url?: string; // Mantido para compatibilidade
  materials?: ProductMaterial[]; // Novo campo para múltiplos links
  checkout_url?: string;
  features?: string[];
  status?: 'published' | 'draft'; // Novo campo de status
  created_at?: string;
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
  homeherotitlesize?: number; // Tamanho da fonte em REM
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
  asaas_production_key?: string;
  asaas_sandbox_key?: string;
  asaas_use_sandbox?: boolean;
  asaas_backend_url?: string;
  // Marketing & Analytics
  google_analytics_id?: string;
  meta_pixel_id?: string;
  meta_api_token?: string;
}

export type LeadStatus = 'Novo' | 'Aguardando Pagamento' | 'Pago' | 'Cancelado' | 'Em Contato' | 'Fechado' | 'Perdido';

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

export type View = 'home' | 'about' | 'products' | 'product-detail' | 'blog' | 'blog-post' | 'contact' | 'faq' | 'policies' | 'refund' | 'privacy' | 'admin' | 'briefing' | 'thank-you' | 'login' | 'my-account' | 'player';
