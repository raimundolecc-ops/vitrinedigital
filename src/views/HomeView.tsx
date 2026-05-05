import { ArrowRight, Star, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Merchant, ViewState } from '../types';
import { MOCK_MERCHANTS } from '../constants';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  onSelectMerchant: (merchant: Merchant) => void;
}

export default function HomeView({ onNavigate, onSelectMerchant }: HomeViewProps) {
  const categories = [
    'Todas as Lojas', 'Padaria Artesanal', 'Produtos Orgânicos', 
    'Artesanato', 'Floriculturas Locais', 'Café Gourmet', 'Casa Eco'
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section>
        <div className="relative overflow-hidden rounded-2xl bg-primary-container p-12 flex items-center min-h-[360px] shadow-lg">
          <div className="z-10 max-w-lg">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-on-primary-container mb-6 leading-tight"
            >
              Apoie a Excelência Local
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-on-primary-container/90 mb-10 font-medium"
            >
              Descubra e compre dos melhores comerciantes independentes do seu bairro.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => onNavigate('LOGIN')}
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-surface-container transition-all flex items-center gap-3 shadow-md active:scale-95 group"
            >
              Seja um Comerciante 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full hidden lg:block select-none">
            <img 
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
              src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800" 
              alt="Artisan Market"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-transparent outline-none"></div>
          </div>
        </div>
      </section>

      {/* Categories Scroller */}
      <section className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-center gap-3 min-w-max">
          {categories.map((cat, i) => (
            <button 
              key={cat}
              className={`px-6 py-2.5 rounded-full font-bold text-sm shadow-sm transition-all whitespace-nowrap active:scale-95 border ${
                i === 0 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Merchants */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-on-surface">Comerciantes em Destaque</h2>
          <button className="flex items-center gap-2 text-primary font-bold hover:underline group text-sm">
            Ver no Mapa 
            <motion.span animate={{ x: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
               <MapPin className="w-4 h-4" />
            </motion.span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_MERCHANTS.map((merchant, i) => (
            <motion.div
              key={merchant.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
              onClick={() => onSelectMerchant(merchant)}
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img 
                  src={merchant.banner} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={merchant.name}
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    MAIS AVALIADOS
                  </span>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                    {merchant.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold text-on-surface">{merchant.rating}</span>
                  </div>
                </div>
                <p className="text-on-surface-variant mb-4 flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-outline" /> {merchant.location}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {merchant.tags.map(tag => (
                    <span key={tag} className="bg-primary/5 text-primary px-3 py-1 rounded text-[10px] font-black tracking-widest border border-primary/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full py-3 bg-surface-container text-on-surface rounded-xl font-bold hover:bg-primary hover:text-white transition-all duration-300 mt-auto text-sm">
                  Visitar Loja
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
