import { Store, ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewState } from '../types';

interface LoginViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function LoginView({ onNavigate }: LoginViewProps) {
  return (
    <div className="flex-grow flex items-center justify-center relative px-6 py-20 min-h-[calc(100vh-160px)]">
      {/* Decorative Circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-6 group cursor-pointer hover:rotate-6 transition-transform">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-primary mb-2">LocalMarket</h1>
          <p className="text-on-surface-variant font-medium">Empowering local commerce and communities.</p>
        </div>

        <div className="bg-white border border-outline-variant p-10 rounded-3xl shadow-2xl shadow-on-surface/5">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface mb-1">Bem-vindo de volta</h2>
            <p className="text-sm text-on-surface-variant font-medium">Por favor, insira seus dados para acessar seu portal.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onNavigate('DASHBOARD'); }}>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl border border-outline-variant">
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-primary shadow-sm font-black text-xs tracking-wider"
              >
                <Store className="w-4 h-4" /> LOJISTA
              </button>
              <button 
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-all font-black text-xs tracking-wider"
              >
                <ShieldCheck className="w-4 h-4" /> ADMIN
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface uppercase tracking-widest pl-1" htmlFor="email">Endereço de e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="email"
                    type="email"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm" 
                    placeholder="nome@mercadolocal.com.br"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center group">
                  <label className="text-xs font-black text-on-surface uppercase tracking-widest pl-1" htmlFor="password">Senha</label>
                  <a className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest cursor-pointer">Esqueceu a senha?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="password"
                    type="password"
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium text-sm" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary appearance-none checked:bg-primary border transition-colors cursor-pointer" 
              />
              <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">Lembrar deste dispositivo por 30 dias</span>
            </label>

            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm tracking-[0.1em] shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              ENTRAR NA CONTA 
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-outline-variant text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              Novo lojista? <a className="text-primary font-black hover:underline cursor-pointer">Candidate-se aqui</a>
            </p>
          </div>
        </div>

        <div className="mt-12 flex justify-center items-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black tracking-widest uppercase">Segurança Ponta a Ponta</span>
          </div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            <span className="text-[10px] font-black tracking-widest uppercase">Portal Oficial</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
