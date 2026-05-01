import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, FileText, Zap, Globe, Users, Terminal, Code, Activity, Building, ArrowRight, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getCalApi } from "@calcom/embed-react";
import { BrandWordmark } from './BrandWordmark';
import { ProfileMenu } from './ProfileMenu';
import { DocDropdown } from './DocDropdown';
import { DevDocDropdown } from './DevDocDropdown';

export const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, loading } = useAuthStore();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
    const [devDropdownOpen, setDevDropdownOpen] = useState(false);
    const productsDropdownRef = useRef<HTMLDivElement>(null);
    const devDropdownRef = useRef<HTMLDivElement>(null);
    const isLandingPage = location.pathname === '/landing' || location.pathname === '/';

    useEffect(() => {
        (async function () {
            const cal = await getCalApi({"namespace":"corridor-sales"});
            cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
        })();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
                setProductsDropdownOpen(false);
            }
            if (devDropdownRef.current && !devDropdownRef.current.contains(event.target as Node)) {
                setDevDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Keep mobile nav state in sync with route changes.
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleGetStarted = () => {
        navigate('/onboarding');
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className={`flex items-center ${isLandingPage ? 'gap-0' : 'gap-2'}`}>
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/corridor-logo.svg" alt="Corridor" className="w-8 h-8" />
                    </div>
                    <BrandWordmark
                        showLeadingC={!isLandingPage}
                        className={`text-xl tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-slate-800'}`}
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {/* Products Dropdown */}
                    <div className="relative group/nav-dropdown h-20 flex items-center" ref={productsDropdownRef}>
                        <button 
                            onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Products <ChevronDown size={14} className={`transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <DocDropdown 
                            isOpen={productsDropdownOpen} 
                            onClose={() => setProductsDropdownOpen(false)} 
                        />
                    </div>

                    {/* Developers Dropdown */}
                    <div className="relative group/nav-dev h-20 flex items-center" ref={devDropdownRef}>
                        <button 
                            onClick={() => setDevDropdownOpen(!devDropdownOpen)}
                            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Developers <ChevronDown size={14} className={`transition-transform duration-200 ${devDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <DevDocDropdown 
                            isOpen={devDropdownOpen} 
                            onClose={() => setDevDropdownOpen(false)} 
                        />
                    </div>

                    <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
                    <Link to="/docs" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Docs</Link>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <button
                        data-cal-namespace="corridor-sales"
                        data-cal-link="james-thaura-qcpzwv/corridor-sales"
                        data-cal-config='{"layout":"month_view", "hideEventTypeDetails":false, "useSlotsViewOnSmallScreen":"true"}'
                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 hover:bg-slate-50 rounded-xl flex items-center gap-2 border border-transparent hover:border-slate-200"
                    >
                        <Building size={16} className="text-slate-400" /> 
                        Contact Sales
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>

                    {loading ? (
                        <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-full"></div>
                    ) : !isAuthenticated ? (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
                            >
                                Sign in
                            </button>
                            <button
                                onClick={handleGetStarted}
                                className="px-6 py-2.5 bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] hover:bg-[linear-gradient(135deg,#04070f_0%,#081229_48%,#0C2244_100%)] text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/45 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Get started - free
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            {!isLandingPage && (
                                <Link 
                                    to="/dashboard" 
                                    className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 py-2"
                                >
                                    Dashboard
                                </Link>
                            )}
                            <ProfileMenu />
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-slate-800"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl">
                    <Link to="/landing#capabilities" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">Features</Link>
                    <Link to="/landing#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">How it works</Link>
                    <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">Docs</Link>
                    <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">Pricing</Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">About</Link>
                    <Link to="/privacy" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">Privacy</Link>
                    <Link to="/legal" onClick={() => setMobileMenuOpen(false)} className="text-slate-600 hover:text-blue-600">Legal</Link>
                    {!isAuthenticated ? (
                        <button onClick={handleGetStarted} className="w-full py-3 bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] rounded-lg font-semibold mt-4 text-white shadow-lg shadow-blue-900/30">Get started - free</button>
                    ) : (
                        <button onClick={() => navigate('/dashboard')} className="w-full py-3 bg-[linear-gradient(135deg,#050912_0%,#0A1731_48%,#0E2A54_100%)] rounded-lg font-semibold mt-4 text-white shadow-lg shadow-blue-900/30">Go to Dashboard</button>
                    )}
                </div>
            )}
        </nav>
    );
};
