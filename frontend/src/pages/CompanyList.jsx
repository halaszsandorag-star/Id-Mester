import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Search } from 'lucide-react';
import api from '../lib/axios';

const CompanyList = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const query = new URLSearchParams(window.location.search);
    const categoryId = query.get('category');

    useEffect(() => {
        fetchCompanies();
    }, [categoryId]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            let url = '/companies';
            if (categoryId) {
                url += `?category=${categoryId}`;
            }
            const res = await api.get(url);
            setCompanies(res.data);
        } catch (error) {
            console.error('Hiba a cégek betöltésekor', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Szolgáltatók listája</h1>

                <div className="max-w-xl relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Keresés név vagy leírás alapján..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Betöltés...</div>
            ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nincs találat</h3>
                    <p className="mt-1 text-gray-500">Próbáld megmódosítani a keresési feltételeket.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCompanies.map((company) => (
                        <Link key={company.id} to={`/company/${company.id}`} className="group block h-full">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full hover:shadow-md hover:border-primary-200 transition-all flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    {company.logo_url ? (
                                        <img src={`http://localhost:3001${company.logo_url}`} alt={company.name} className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-100 shrink-0" />
                                    ) : (
                                        <div className="w-14 h-14 shrink-0 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center text-2xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                            {company.category_icon || '🏢'}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{company.name}</h2>
                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md mt-1 font-medium">{company.category_name}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">
                                    {company.description || 'Nincs megadva leírás.'}
                                </p>

                                <div className="space-y-2 mt-auto pt-4 border-t border-gray-50">
                                    {company.address && (
                                        <div className="flex items-start gap-2 text-sm text-gray-500">
                                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                            <span>{company.address}</span>
                                        </div>
                                    )}
                                    {company.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Phone className="w-4 h-4 shrink-0" />
                                            <span>{company.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompanyList;
