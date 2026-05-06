import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, CalendarClock, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
    };

    const isHome = location.pathname === '/';

    return (
        <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isHome ? 'bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm' : 'bg-white shadow-sm border-b border-gray-100'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl shadow-glow group-hover:scale-110 transition-transform duration-300">
                                <CalendarClock className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                IdőpontMester
                            </span>
                        </Link>
                    </div>

                    {/* Asztali menü */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/companies" className="text-slate-600 hover:text-primary-600 font-medium transition-colors hover:-translate-y-0.5 transform">
                            Szolgáltatók
                        </Link>

                        {user ? (
                            <>
                                <div className="h-6 w-px bg-slate-200"></div>
                                <Link
                                    to={user.role === 'company' ? '/company/dashboard' : '/user/dashboard'}
                                    className="flex items-center gap-2 text-slate-700 hover:text-primary-600 font-medium transition-colors hover:-translate-y-0.5 transform"
                                >
                                    <LayoutDashboard className="h-5 w-5" /> Vezérlőpult
                                </Link>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm text-slate-600 font-semibold shadow-inner">
                                    <UserIcon className="h-4 w-4 text-primary-500" /> {user.name}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl font-medium transition-all"
                                    title="Kijelentkezés"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 ml-4">
                                <Link to="/login" className="text-slate-600 hover:text-primary-600 font-semibold transition-colors">
                                    Bejelentkezés
                                </Link>
                                <Link to="/register" className="btn-primary">
                                    Regisztráció
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobil menü gomb */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobil menü panel */}
            {isOpen && (
                <div className="md:hidden glass border-b border-t animate-fade-in absolute w-full left-0 top-20 shadow-xl">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <Link
                            to="/companies"
                            className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Szolgáltatók listája
                        </Link>

                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'company' ? '/company/dashboard' : '/user/dashboard'}
                                    className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Vezérlőpult
                                </Link>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="px-4 py-2 text-sm font-semibold text-slate-500 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" /> {user.name}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left flex items-center gap-2 px-4 py-3 mt-2 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" /> Kijelentkezés
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="pt-4 flex flex-col gap-3">
                                <Link
                                    to="/login"
                                    className="block px-4 py-3 text-center rounded-xl text-base font-semibold text-slate-700 bg-slate-50 border border-slate-100"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Bejelentkezés
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-4 py-3 text-center rounded-xl text-base font-semibold text-white bg-primary-600 shadow-lg shadow-primary-500/30"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Regisztráció
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
