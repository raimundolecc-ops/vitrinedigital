import { LayoutDashboard, Package, Receipt, Users, BarChart3, Settings, HelpCircle, Plus } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const navItems = [
    { label: 'Painel', icon: LayoutDashboard, view: 'DASHBOARD' as ViewState },
    { label: 'Estoque', icon: Package, view: 'DASHBOARD' as ViewState },
    { label: 'Pedidos', icon: Receipt, view: 'DASHBOARD' as ViewState },
    { label: 'Clientes', icon: Users, view: 'DASHBOARD' as ViewState },
    { label: 'Análise', icon: BarChart3, view: 'DASHBOARD' as ViewState },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low border-r border-outline-variant flex flex-col p-4 gap-2 z-40">
      <div className="px-2 py-6 mb-4">
        <h2 className="text-lg font-bold text-on-surface">Portal do Lojista</h2>
        <p className="text-xs text-on-surface-variant">Excelência Local</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              currentView === item.view 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.view ? 'text-primary' : 'text-outline group-hover:text-primary'}`} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
        <button 
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm shadow-md"
          onClick={() => onNavigate('ADD_PRODUCT')}
        >
          <Plus className="w-4 h-4" />
          Adicionar Produto
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all text-sm">
          <Settings className="w-5 h-5 text-outline" /> Configurações
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all text-sm">
          <HelpCircle className="w-5 h-5 text-outline" /> Suporte
        </button>
      </div>
    </aside>
  );
}
