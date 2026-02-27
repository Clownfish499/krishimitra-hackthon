import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import VoiceAssistant from './components/VoiceAssistant';

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
import Login from './pages/Login';
import Register from './pages/Register';

/** Redirect to /login if not authenticated */
function ProtectedRoute({ children }) {
    const { isLoggedIn } = useAuth();
    return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/** Redirect to / if already authenticated */
function GuestRoute({ children }) {
    const { isLoggedIn } = useAuth();
    return isLoggedIn ? <Navigate to="/" replace /> : children;
}

function AppShell() {
    const { isLoggedIn } = useAuth();
    return (
        <div className="app-shell">
            {isLoggedIn && <Sidebar />}
            <div className={isLoggedIn ? 'app-main' : 'app-main app-main--full'}>
                {isLoggedIn && <NotificationBell />}
                {isLoggedIn && <VoiceAssistant />}
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                    {/* Protected routes */}
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                    <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/crop-recommendation" element={<ProtectedRoute><CropRecommendation /></ProtectedRoute>} />
                    <Route path="/disease-detection" element={<ProtectedRoute><DiseaseDetection /></ProtectedRoute>} />
                    <Route path="/fertilizer-guide" element={<ProtectedRoute><FertilizerGuide /></ProtectedRoute>} />
                    <Route path="/profit-calculator" element={<ProtectedRoute><ProfitCalculator /></ProtectedRoute>} />
                    <Route path="/mandi-rates" element={<ProtectedRoute><MandiRates /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
                </Routes>
            </div>
        </div>
    );
}

function App() {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    return (
        <LanguageProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppShell />
                </BrowserRouter>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
