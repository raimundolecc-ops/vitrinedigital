import { Heart, ShoppingCart, MapPin, Grid, List as ListIcon, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Merchant, ViewState } from '../types';
import { MOCK_PRODUCTS } from '../constants';

interface MerchantViewProps {
  merchant: Merchant | null;
  onNavigate: (view: ViewState) => void;
}

export default function MerchantView({ merchant, onNavigate }: MerchantViewProps) {
  if (!merchant) return null;

  const categories = ['Todos os Produtos', 'Produtos Frescos', 'Laticínios e Ovos', 'Artesanato', 'Temperos'];

  return (
    <div className="space-y-12">
      {/* Merchant Header */}
      <section>
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-md group">
          <img src={merchant.banner} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-8 left-8 flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden shrink-0">
              <img src={merchant.logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="mb-2">
              <h1 className="text-4xl font-bold text-white mb-2 leading-tight">{merchant.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <p className="font-bold flex items-center gap-2 text-sm bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30">
                  <MapPin className="w-4 h-4" /> {merchant.location}
                </p>
                <div className="flex items-center gap-1.5 bg-yellow-500 text-on-surface px-3 py-1.5 rounded-lg border border-yellow-400 font-black text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {merchant.rating} ({merchant.reviewsCount} Avaliações)
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 right-8 flex gap-3">
            <button className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-6 py-2.5 rounded-xl font-bold hover:bg-white/30 transition-all active:scale-95 text-sm shadow-lg">
              Seguir
            </button>
            <button className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-xl shadow-primary/20 active:scale-95 text-sm">
              Contatar Loja
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 space-y-10">
          <div>
            <h2 className="text-xl font-bold text-on-surface mb-6">Categorias</h2>
            <ul className="space-y-1.5">
              {categories.map((cat, i) => (
                <li 
                  key={cat}
                  className={`flex items-center justify-between p-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
                    i === 0 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-xs opacity-50 bg-surface-container-highest px-2 py-0.5 rounded-full">{10 + i * 5}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-on-surface mb-6">Filtros</h2>
            <div className="space-y-8">
              <div>
                <p className="font-bold text-sm text-on-surface mb-4 underline decoration-primary decoration-2 underline-offset-4">Preço</p>
                <div className="px-2">
                  <div className="h-1 bg-surface-container-highest rounded-full relative">
                    <div className="absolute h-full w-2/3 bg-primary left-0 rounded-full"></div>
                    <div className="absolute -top-2 left-0 w-5 h-5 bg-white border-2 border-primary rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"></div>
                    <div className="absolute -top-2 left-[66%] w-5 h-5 bg-white border-2 border-primary rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"></div>
                  </div>
                  <div className="flex justify-between mt-6 text-[10px] text-outline font-black uppercase tracking-widest">
                    <span>$0</span>
                    <span>$100+</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-sm text-on-surface mb-4 underline decoration-primary decoration-2 underline-offset-4">Atributos</p>
                <div className="space-y-3">
                  {['Certificado Orgânico', 'Sustentável', 'Origem Local'].map((pref, i) => (
                    <label key={pref} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          defaultChecked={i === 0}
                          className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary appearance-none checked:bg-primary border transition-colors cursor-pointer" 
                        />
                        {i === 0 && <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none text-[10px] font-bold">✓</span>}
                      </div>
                      <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div>
              <h3 className="text-2xl font-bold text-on-surface mb-1">Destaques da Temporada</h3>
              <p className="text-sm text-on-surface-variant font-medium">Mostrando todos os resultados disponíveis para entrega hoje</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <select className="bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface-variant shadow-sm flex-grow sm:flex-grow-0">
                <option>Ordenar por: Popularidade</option>
                <option>Preço: Menor para Maior</option>
              </select>
              <div className="flex p-1 bg-surface-container-high rounded-xl border border-outline-variant shadow-inner">
                <button className="p-2 bg-white text-primary rounded-lg shadow-sm border border-outline-variant">
                  <Grid className="w-5 h-5" />
                </button>
                <button className="p-2 text-outline hover:text-primary transition-colors">
                  <ListIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {MOCK_PRODUCTS.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-3xl overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-container">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  {product.isOrganic && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20 shadow-sm">
                      Orgânico
                    </div>
                  )}
                   {product.isBestseller && (
                    <div className="absolute top-4 left-4 bg-primary text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                      MAIS VENDIDO
                    </div>
                  )}
                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-outline hover:text-red-500 hover:bg-white transition-all shadow-md">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">{product.name}</h4>
                    <span className="text-primary font-black text-lg whitespace-nowrap ml-2">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs font-bold text-outline mb-6 tracking-wide uppercase">{product.unit}</p>
                  <button className="w-full py-3.5 bg-surface-container-highest hover:bg-primary hover:text-white text-on-surface font-black rounded-2xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 text-xs tracking-widest mt-auto border border-outline-variant/50 hover:border-primary">
                    <ShoppingCart className="w-4 h-4" /> ADICIONAR AO CARRINHO
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-16 flex justify-center">
            <nav className="flex items-center gap-2 p-1.5 bg-white border border-outline-variant rounded-2xl shadow-sm">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-outline transition-all">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white font-black text-sm shadow-md shadow-primary/20">1</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface-variant font-bold text-sm">2</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface-variant font-bold text-sm">3</button>
              <span className="px-2 text-outline font-black text-sm">...</span>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-low text-on-surface-variant font-bold text-sm">12</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-outline transition-all">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
