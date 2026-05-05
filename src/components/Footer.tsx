import { ViewState } from '../types';

interface FooterProps {
  onNavigate: (view: ViewState) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full mt-auto bg-white border-t border-outline-variant">
      <div className="max-w-[1200px] mx-auto py-12 px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="font-bold text-on-surface text-xl block mb-4">LocalMarket</span>
            <p className="text-body-md text-on-surface-variant text-sm">
              Empoderando comerciantes locais e conectando comunidades através de um comércio sustentável e de alta qualidade.
            </p>
          </div>
          <div>
            <h4 className="font-headline-md text-on-surface mb-4 text-base">Mercado</h4>
            <ul className="space-y-3">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Explorar Lojas</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Novidades</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Escolha Sustentável</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline-md text-on-surface mb-4 text-base">Comunidade</h4>
            <ul className="space-y-3">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Sobre Nós</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Impacto Social</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-headline-md text-on-surface mb-4 text-base">Negócios</h4>
            <p className="text-sm text-on-surface-variant mb-4">Junte-se à nossa comunidade de mais de 10.000 lojistas locais.</p>
            <button 
              className="w-full bg-on-surface text-surface py-3 rounded-lg font-bold hover:opacity-90 transition-all text-sm"
              onClick={() => onNavigate('LOGIN')}
            >
              Torne-se um Vendedor
            </button>
          </div>
        </div>
        <div className="pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-on-surface-variant">© 2024 LocalMarket Commerce. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors underline" href="#">Privacidade</a>
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors underline" href="#">Termos</a>
            <a className="text-xs text-on-surface-variant hover:text-primary transition-colors underline" href="#">Contato</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
