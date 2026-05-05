import { Product, Merchant } from './types';

export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: '1',
    name: 'Green Valley Organics',
    location: 'Westside Market, Downtown',
    rating: 4.9,
    reviewsCount: 1200,
    banner: 'https://images.unsplash.com/photo-1500651230702-0e2d8a4914ad?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
    categories: ['Produtos Orgânicos', 'Produtos Frescos'],
    tags: ['ORGÂNICO', 'FRESCO']
  },
  {
    id: '2',
    name: 'The Sourdough Loft',
    location: 'Heritage District',
    rating: 4.8,
    reviewsCount: 850,
    banner: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=200',
    categories: ['Padaria Artesanal'],
    tags: ['PADARIA', 'ARTESANAL']
  },
  {
    id: '3',
    name: 'Bloom & Stem',
    location: 'East Garden Lane',
    rating: 4.7,
    reviewsCount: 420,
    banner: 'https://images.unsplash.com/photo-1490750967868-88aa354f7a4?auto=format&fit=crop&q=80&w=1200',
    logo: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=200',
    categories: ['Floriculturas Locais'],
    tags: ['FLORAL', 'LOCAL']
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Tomates de Rama Heirloom',
    category: 'Hortifruti',
    price: 8.50,
    unit: 'Por Cacho de 500g',
    stock: 42,
    image: 'https://images.unsplash.com/photo-1590779033100-9f60702a4221?auto=format&fit=crop&q=80&w=400',
    isOrganic: true,
    status: 'EM ESTOQUE'
  },
  {
    id: '2',
    name: 'Couve Crespa Orgânica',
    category: 'Hortifruti',
    price: 4.20,
    unit: 'Maço Grande',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=400',
    isLocal: true,
    status: 'ESTOQUE BAIXO'
  },
  {
    id: '3',
    name: 'Mel Silvestre Cru',
    category: 'Mercearia',
    price: 14.00,
    unit: 'Pote 350g',
    stock: 0,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
    isBestseller: true,
    status: 'FORA DE ESTOQUE'
  }
];
