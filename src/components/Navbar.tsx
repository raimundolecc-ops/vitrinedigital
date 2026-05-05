import { Search, MapPin, ShoppingCart, Bell, User } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const isDashboard = currentView === 'DASHBOARD' || currentView === 'ADD_PRODUCT';

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-8 py-3">
        <div className="flex items-center gap-8 flex-1">
          <span 
            className="text-xl font-bold tracking-tight text-primary cursor-pointer"
            onClick={() => onNavigate('EXPLORER')}
          >
            LocalMarket
          </span>
          
           {!isDashboard && (
            <div className="flex-1 max-w-md relative group hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-outline group-focus-within:text-primary" />
              </div>
              <input 
                className="block w-full pl-10 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-primary focus:border-primary transition-all outline-none" 
                placeholder="Pesquisar lojistas e produtos..." 
                type="text"
              />
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6 px-4">
          <a 
            className={`font-label-md text-sm cursor-pointer transition-colors ${currentView === 'EXPLORER' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => onNavigate('EXPLORER')}
          >
            Explorar
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Lojas</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Ofertas</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">Mapa</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all active:scale-95">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all active:scale-95 relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>
          <div 
            className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant cursor-pointer active:scale-95 transition-transform"
            onClick={() => onNavigate('LOGIN')}
          >
            <img 
              alt="User" 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=32&h=32&q=80" 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
