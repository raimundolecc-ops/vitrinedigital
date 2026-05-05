import { TrendingUp, ShoppingBasket, Star, Users, Search, Bell, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, ViewState } from '../types';
import { MOCK_PRODUCTS } from '../constants';

interface DashboardViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const metrics = [
    { label: 'Receita Total', value: '$12,845.00', trend: '+12.5%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total de Pedidos', value: '452', trend: '+4.2%', icon: ShoppingBasket, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avaliação Média', value: '4.9/5.0', trend: 'Ativo', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Novos Clientes', value: '84', trend: '+18%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">Visão Geral do Painel</h2>
          <p className="text-on-surface-variant font-medium">Bem-vindo de volta, seu mercado local está prosperando hoje.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              className="pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl w-full md:w-72 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" 
              placeholder="Pesquisar dados..." 
              type="text"
            />
          </div>
          <button className="p-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors relative border border-outline-variant bg-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <motion.div 
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${metric.bg} ${metric.color} rounded-xl group-hover:scale-110 transition-transform`}>
                <metric.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${metric.bg} ${metric.color}`}>
                {metric.trend}
              </span>
            </div>
            <p className="text-on-surface-variant font-bold text-xs uppercase tracking-wider mb-1">{metric.label}</p>
            <h3 className="text-2xl font-black text-on-surface">{metric.value}</h3>
          </motion.div>
        ))}
      </section>

      {/* Inventory Table */}
      <section className="bg-white rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-8 border-b border-outline-variant flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-on-surface">Estoque de Produtos</h3>
            <p className="text-sm text-on-surface-variant font-medium">Gerencie seus anúncios ativos e níveis de estoque</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span> Filtrar
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-sm">download</span> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em]">PRODUTO</th>
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em]">CATEGORIA</th>
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em]">PREÇO</th>
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em]">ESTOQUE</th>
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em]">SITUAÇÃO</th>
                <th className="px-8 py-4 font-black text-[10px] text-outline uppercase tracking-[0.1em] text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {MOCK_PRODUCTS.map((product) => (
                <tr key={product.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-surface-container overflow-hidden shrink-0 border border-outline-variant/30 group-hover:scale-105 transition-transform">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{product.name}</p>
                        <p className="text-[10px] font-black text-outline tracking-wider">ID: SKU-{product.id}00{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-on-surface-variant text-xs">{product.category}</td>
                  <td className="px-8 py-5 font-black text-primary text-sm">${product.price.toFixed(2)}</td>
                  <td className="px-8 py-5 font-bold text-on-surface-variant text-xs uppercase tracking-wider">{product.stock} unidades</td>
                  <td className="px-8 py-5">
                    <span 
                      className={`px-3 py-1 text-[10px] font-black rounded-lg tracking-widest ${
                        product.status === 'EM ESTOQUE' 
                        ? 'bg-primary/10 text-primary' 
                        : product.status === 'ESTOQUE BAIXO' 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-surface-container-highest text-outline'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2.5 hover:bg-surface-container-highest rounded-xl text-outline hover:text-primary transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 hover:bg-error/10 rounded-xl text-outline hover:text-error transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-on-surface-variant font-bold text-xs">Exibindo 1-3 de 42 produtos</span>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-outline hover:bg-surface-container-high transition-all disabled:opacity-30" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl font-black text-xs shadow-md">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-outline hover:bg-surface-container-high font-bold text-xs">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-outline hover:bg-surface-container-high font-bold text-xs">3</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant text-outline hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
