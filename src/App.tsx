/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ViewState, Merchant } from './types';
import { MOCK_MERCHANTS } from './constants';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import HomeView from './views/HomeView';
import MerchantView from './views/MerchantView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import AddProductView from './views/AddProductView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('EXPLORER');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    handleNavigate('MERCHANT');
  };

  const showSidebar = useMemo(() => {
    return currentView === 'DASHBOARD' || currentView === 'ADD_PRODUCT';
  }, [currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col relative pt-16">
        {showSidebar && (
          <Sidebar currentView={currentView} onNavigate={handleNavigate} />
        )}
        
        <main className={`flex-1 p-8 md:p-12 transition-all duration-500 ease-in-out ${showSidebar ? 'lg:ml-64' : ''}`}>
          <div className="max-w-[1200px] mx-auto w-full">
            {currentView === 'EXPLORER' && (
              <HomeView onNavigate={handleNavigate} onSelectMerchant={handleSelectMerchant} />
            )}
            
            {currentView === 'MERCHANT' && (
              <MerchantView merchant={selectedMerchant || MOCK_MERCHANTS[0]} onNavigate={handleNavigate} />
            )}
            
            {currentView === 'DASHBOARD' && (
              <DashboardView onNavigate={handleNavigate} />
            )}
            
            {currentView === 'LOGIN' && (
              <LoginView onNavigate={handleNavigate} />
            )}
            
            {currentView === 'ADD_PRODUCT' && (
              <AddProductView onNavigate={handleNavigate} />
            )}
          </div>
        </main>
      </div>

      <Footer onNavigate={handleNavigate} />

      {/* Floating Action Button (Optional, as seen in explorer image) */}
      {currentView === 'EXPLORER' && (
        <button 
          className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group border-4 border-white"
          onClick={() => handleNavigate('LOGIN')}
        >
          <span className="material-symbols-outlined text-3xl font-black">add</span>
          <div className="absolute right-full mr-4 bg-on-surface text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            VENDER PRODUTO
          </div>
        </button>
      )}
    </div>
  );
}
