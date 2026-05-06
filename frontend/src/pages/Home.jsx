import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Star, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (error) {
                console.error('Kategóriák betöltése sikertelen');
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) {
            navigate(`/companies?search=${encodeURIComponent(search)}`);
        } else {
            navigate(`/companies`);
        }
    };

    const navigateToCategory = (id) => {
        navigate(`/companies?category=${id}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-20">

            {/* Hero Szekció animált hátérrel */}
            <section className="relative overflow-hidden px-4 pt-20 pb-32 sm:px-6 lg:px-8">
                {/* Lebegő Blob Animációk (Háttér) */}
                <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full max-w-7xl overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                    <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center animate-slide-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 mb-8 hover:shadow-md transition-shadow cursor-default">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        A legjobb szolgáltatók egy helyen
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 leading-tight">
                        Találd meg a szakembert <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-400">
                            másodpercek alatt
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Fodrász, fogorvos, vagy autószerelő? Felejtsd el a telefonálgatást. Foglalj gyorsan és egyszerűen, a nap 24 órájában.
                    </p>

                    {/* Keresőmező Glassmorphism */}
                    <form
                        onSubmit={handleSearch}
                        className={`max-w-3xl mx-auto relative transition-all duration-300 ${isFocused ? 'scale-[1.02] shadow-glow' : 'shadow-xl'} rounded-2xl md:rounded-full bg-white p-2 border border-slate-100 flex flex-col md:flex-row items-center gap-2`}
                    >
                        <div className="pl-4 text-slate-400 hidden md:block">
                            <Search className="h-6 w-6" />
                        </div>
                        <input
                            type="text"
                            placeholder="Mit keresel? (Pl. Hajvágás, Masszázs...)"
                            className="flex-grow w-full px-4 py-4 md:py-3 outline-none text-slate-800 bg-transparent text-lg font-medium placeholder:text-slate-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        <button type="submit" className="w-full md:w-auto btn-primary py-4 md:py-3 px-8 text-lg flex justify-center items-center gap-2 group">
                            Keresés <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    {/* Features */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-600 font-medium">
                        <div className="flex items-center justify-center gap-2"><Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Megbízható partnerek</div>
                        <div className="flex items-center justify-center gap-2"><Clock className="w-5 h-5 text-primary-500" /> 0-24 online foglalás</div>
                        <div className="flex items-center justify-center gap-2"><Shield className="w-5 h-5 text-teal-500" /> Ingyenes használat</div>
                    </div>
                </div>
            </section>

            {/* Kategóriák */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-24">
                <div className="flex justify-between items-end mb-8 md:mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Népszerű kategóriák</h2>
                        <p className="text-slate-500 text-lg">Válogass a legkeresettebb szolgáltatások közül</p>
                    </div>
                    <button onClick={() => navigate('/companies')} className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-700 transition-colors group">
                        Összes böngészése <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {categories.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 animate-pulse">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-40 border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {categories.slice(0, 10).map((cat, index) => (
                            <div
                                key={cat.id}
                                onClick={() => navigateToCategory(cat.id)}
                                className="group cursor-pointer animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="bg-white rounded-2xl p-6 md:p-8 text-center border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 h-full flex flex-col items-center justify-center transform hover:-translate-y-1 relative overflow-hidden">
                                    {/* Decorative hover gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    <div className="relative z-10">
                                        <div className="text-5xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 drop-shadow-sm filter">
                                            {cat.icon}
                                        </div>
                                        <h3 className="font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{cat.name}</h3>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={() => navigate('/companies')} className="mt-8 w-full sm:hidden flex items-center justify-center gap-1 py-4 bg-white border border-slate-200 rounded-xl text-primary-600 font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                    Összes kategória böngészése <ChevronRight className="w-5 h-5" />
                </button>
            </section>

        </div>
    );
};

export default Home;
