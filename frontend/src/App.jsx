import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';

// Pages
import Home from './pages/Home';
import AIAssistant from './pages/AIAssistant';
import Weather from './pages/Weather';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import FertilizerGuide from './pages/FertilizerGuide';
import ProfitCalculator from './pages/ProfitCalculator';
import MandiRates from './pages/MandiRates';
import Translator from './pages/Translator';

function App() {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <LanguageProvider>
            <AuthProvider>
                <BrowserRouter>
                    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
                        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                        <div className={`app-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
                            <NotificationBell />
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/ai" element={<AIAssistant />} />
                                <Route path="/weather" element={<Weather />} />
                                <Route path="/marketplace" element={<Marketplace />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/crop-recommendation" element={<CropRecommendation />} />
                                <Route path="/disease-detection" element={<DiseaseDetection />} />
                                <Route path="/fertilizer-guide" element={<FertilizerGuide />} />
                                <Route path="/profit-calculator" element={<ProfitCalculator />} />
                                <Route path="/mandi-rates" element={<MandiRates />} />
                                <Route path="/translator" element={<Translator />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
