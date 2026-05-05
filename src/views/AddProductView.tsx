import { Info, ImagePlus, CheckCircle2, ChevronRight, Plus, MapPin, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewState } from '../types';

interface AddProductViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function AddProductView({ onNavigate }: AddProductViewProps) {
  return (
    <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start pb-20">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="md:col-span-7 space-y-10"
      >
        <header>
          <h1 className="text-4xl font-black text-on-surface mb-3 leading-tight">Cadastrar Novo Produto</h1>
          <p className="text-on-surface-variant font-medium">Forneça os detalhes abaixo para listar sua criação no mercado local.</p>
        </header>

        <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); onNavigate('DASHBOARD'); }}>
          {/* Essential Info Section */}
          <section className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm space-y-8">
            <h3 className="text-lg font-black text-primary flex items-center gap-3">
              <Info className="w-6 h-6 border-2 border-primary rounded-full p-0.5" /> 
              Informações Básicas
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Nome do Produto</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm outline-none" 
                placeholder="ex: Vela de Soja Artesanal" 
                type="text"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Categoria</label>
                <div className="relative">
                  <select className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-sm outline-none appearance-none">
                    <option>Decoração</option>
                    <option>Bem-estar</option>
                    <option>Culinária</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-outline w-4 h-4 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Tags (opcional)</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm outline-none" 
                  placeholder="ex: Orgânico, Vegano" 
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Descrição Detalhada</label>
              <textarea 
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 min-h-[140px] focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium text-sm outline-none resize-none" 
                placeholder="Descreva a história, materiais e características únicas do seu produto..." 
              />
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="bg-white p-8 rounded-3xl border border-outline-variant shadow-sm space-y-8">
            <h3 className="text-lg font-black text-primary flex items-center gap-3">
              <Package className="w-6 h-6 border-2 border-primary rounded-full p-0.5" /> 
              Venda e Estoque
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Preço Unitário (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-outline">R$</span>
                  <input 
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-sm outline-none" 
                    placeholder="0.00" 
                    type="number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest pl-1">Quantidade Inicial</label>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-4 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-bold text-sm outline-none" 
                  placeholder="0" 
                  type="number"
                />
              </div>
            </div>
            
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="w-6 h-6 rounded-lg border-2 border-primary text-primary focus:ring-primary appearance-none cursor-pointer checked:bg-primary transition-all" />
                <Plus className="absolute inset-0 m-auto text-white w-4 h-4 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
              <label className="text-sm font-bold text-primary tracking-wide">Disponível apenas para retirada local</label>
            </div>
          </section>

          <footer className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              type="submit"
              className="w-full sm:flex-grow bg-primary text-white py-5 rounded-2xl font-black text-sm tracking-[0.15em] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              PUBLICAR PRODUTO
            </button>
            <button 
              type="button" 
              className="w-full sm:w-auto px-10 py-5 bg-surface-container-highest text-on-surface rounded-2xl font-black text-sm tracking-widest hover:brightness-95 transition-all outline-none border border-outline-variant/50"
            >
              SALVAR RASCUNHO
            </button>
          </footer>
        </form>
      </motion.div>

      {/* Preview Section */}
      <motion.aside 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="md:col-span-5 md:sticky md:top-24 space-y-8"
      >
        <div className="bg-white rounded-[32px] border border-outline-variant shadow-2xl overflow-hidden group">
          <div className="relative aspect-[4/5] bg-surface-container-low flex flex-col items-center justify-center border-b border-outline-variant/30">
            <ImagePlus className="w-16 h-16 text-outline mb-4 group-hover:scale-110 transition-transform duration-500" />
            <p className="text-xs font-black text-outline uppercase tracking-widest">Carregar Foto</p>
            <button className="mt-8 px-6 py-2.5 bg-white border border-outline-variant rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-primary transition-colors">
              Selecionar Arquivo
            </button>
          </div>
          <div className="p-10 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg tracking-widest uppercase mb-1">
                  PREVIEW
                </span>
                <h4 className="text-2xl font-black text-on-surface leading-tight">Título do Produto</h4>
              </div>
              <span className="text-2xl font-black text-primary">$0.00</span>
            </div>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">
              "A história da sua criação aparecerá aqui. Descreva os materiais, o processo e o que torna este item único."
            </p>
            <div className="flex gap-4 pt-6 border-t border-outline-variant/50">
              <div className="flex items-center gap-1.5 text-outline text-[10px] font-black uppercase tracking-widest">
                <MapPin className="w-3 h-3 text-primary" /> Mercado Central
              </div>
              <div className="flex items-center gap-1.5 text-outline text-[10px] font-black uppercase tracking-widest">
                <Package className="w-3 h-3 text-primary" /> 0 em estoque
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 space-y-4">
          <h5 className="font-black text-sm text-primary flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Dica de Sucesso
          </h5>
          <p className="text-on-surface-variant text-xs font-semibold leading-relaxed">
            Anúncios com fotos em luz natural e descrições baseadas na história recebem 3x mais cliques na LocalMarket.
          </p>
        </div>
      </motion.aside>
    </div>
  );
}
