import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Phone, Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const CompanyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [company, setCompany] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedService, setSelectedService] = useState('');
    const [notes, setNotes] = useState('');
    const [services, setServices] = useState([]);

    useEffect(() => {
        fetchCompanyData();
    }, [id]);

    const fetchCompanyData = async () => {
        try {
            const [compRes, slotsRes, srvRes] = await Promise.all([
                api.get(`/companies/${id}`),
                api.get(`/companies/${id}/slots`),
                api.get(`/companies/${id}/services`)
            ]);
            setCompany(compRes.data);
            setSlots(slotsRes.data);
            setServices(srvRes.data);
        } catch (error) {
            console.error('Hiba az adatok betöltésekor', error);
        } finally {
            setLoading(false);
        }
    };

    const groupedSlots = slots.reduce((acc, slot) => {
        const d = slot.slot_date.split('T')[0];
        if (!acc[d]) acc[d] = [];
        acc[d].push(slot);
        return acc;
    }, {});

    const handleBook = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'company') {
            alert('Szolgáltatóként nem foglalhatsz időpontot magadnak. Teszteléshez kérlek regisztrálj egy vásárlói fiókot!');
            return;
        }
        if (!selectedSlot) {
            alert('Válassz ki egy időpontot a listából!');
            return;
        }
        if (services.length > 0 && !selectedService) {
            alert('Kérlek válassz egy szolgáltatást a foglaláshoz!');
            return;
        }

        setBookingLoading(true);
        try {
            await api.post('/appointments', {
                slot_id: selectedSlot.id,
                notes: notes,
                service_id: selectedService || null
            });
            setSuccessMsg(`Sikeresen lefoglaltad: ${selectedSlot.start_time.substring(0, 5)}`);
            setSelectedSlot(null);
            setSelectedService('');
            setNotes('');
            const slotsRes = await api.get(`/companies/${id}/slots`);
            setSlots(slotsRes.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Hiba a foglalás során');
        } finally {
            setBookingLoading(false);
            setTimeout(() => setSuccessMsg(''), 5000);
        }
    };

    if (loading) return <div className="p-8 text-center pt-24 text-gray-500">Betöltés...</div>;
    if (!company) return <div className="p-8 text-center pt-24 text-2xl">A szolgáltató nem található.</div>;

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center border border-green-200 shadow-sm animate-fade-in">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                <div className="h-48 bg-primary-600 flex items-center justify-center relative overflow-hidden">
                    {company.logo_url && (
                        <img src={`http://localhost:3001${company.logo_url}`} alt="Borítókép" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                    )}
                    <span className="text-6xl relative z-10">{company.category_icon || '🏢'}</span>
                </div>

                <div className="px-8 pb-8 relative">
                    <div className="absolute -top-12 left-8 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center w-24 h-24 overflow-hidden">
                        {company.logo_url ? (
                            <img src={`http://localhost:3001${company.logo_url}`} alt={company.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Building2 className="w-10 h-10 text-primary-600" />
                        )}
                    </div>

                    <div className="pt-16 sm:flex sm:justify-between sm:items-start">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{company.name}</h1>
                            <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full font-semibold border border-primary-100">
                                {company.category_name}
                            </span>
                        </div>

                        <div className="mt-4 sm:mt-0 space-y-2 text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {company.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> <span>{company.address}</span>
                                </div>
                            )}
                            {company.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> <span>{company.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Bemutatkozás</h2>
                        <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                            {company.description || 'A szolgáltató nem adott meg részletes leírást.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-primary-600" /> Időpont foglalása
                </h2>

                {Object.keys(groupedSlots).length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100 text-gray-500">
                        Jelenleg nincs foglalható szabad időpont ennél a szolgáltatónál. Nézz vissza később!
                    </div>
                ) : (
                    <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.keys(groupedSlots).sort().map(date => (
                                <div key={date} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <h3 className="font-bold text-gray-700 mb-3 block border-b pb-2">
                                        {new Date(date).toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {groupedSlots[date].map(slot => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${selectedSlot?.id === slot.id
                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-[1.02]'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600'
                                                    }`}
                                            >
                                                <Clock className="w-4 h-4 mr-1.5" />
                                                {slot.start_time.substring(0, 5)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-fit sticky top-24">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Foglalás részletei</h3>

                            {selectedSlot ? (
                                <div className="mb-6 p-4 bg-white border border-primary-100 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-1">Kiválasztott időpont:</p>
                                    <p className="font-bold text-primary-700 text-lg">
                                        {new Date(selectedSlot.slot_date).toLocaleDateString('hu-HU')} <br />
                                        {selectedSlot.start_time.substring(0, 5)} - {selectedSlot.end_time.substring(0, 5)}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm text-center">
                                    Jelölj ki egy időpontot a bal oldali listából.
                                </div>
                            )}

                            {services.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Válassz szolgáltatást *</label>
                                    <select
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    >
                                        <option value="">-- Kérlek válassz --</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.price} Ft, {s.duration_minutes} perc)</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Megjegyzés a szolgáltatónak (Opcionális)</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none h-24"
                                    placeholder="Pl. Hosszú hajra szeretnék időpontot..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedSlot || bookingLoading}
                                className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-all shadow-md ${!selectedSlot
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : bookingLoading
                                        ? 'bg-primary-400 cursor-wait'
                                        : 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg'
                                    }`}
                            >
                                {bookingLoading ? 'Foglalás...' : 'Időpont lefoglalása'}
                            </button>

                            {!user && (
                                <p className="text-center text-xs text-gray-500 mt-3 pt-3 border-t">
                                    A foglaláshoz be kell jelentkezned. A gomb megnyomásakor átirányítunk.
                                </p>
                            )}
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
};

export default CompanyProfile;
