import React, { useState, useEffect } from 'react';
import { Building2, Calendar as CalendarIcon, Clock, Users, Plus, CheckCircle, XCircle, Settings, Save, Upload, Image as ImageIcon, Briefcase, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const CompanyDashboard = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [categories, setCategories] = useState([]);
    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Új időpont űrlap
    const [newDate, setNewDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');

    // Új szolgáltatás űrlap
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');
    const [newServiceDuration, setNewServiceDuration] = useState('30');
    const [newServiceDesc, setNewServiceDesc] = useState('');

    // Profil Form a szerkesztéshez / létrehozáshoz
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [profileForm, setProfileForm] = useState({
        name: '',
        description: '',
        category_id: '',
        address: '',
        phone: '',
        logo: null
    });

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Kategóriák betöltése sikertelen', err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            try {
                const profRes = await api.get('/companies/my/profile');
                setProfile(profRes.data);
                setLogoPreview(profRes.data.logo_url ? `http://localhost:3001${profRes.data.logo_url}` : null);
                setProfileForm({
                    name: profRes.data.name,
                    description: profRes.data.description || '',
                    category_id: profRes.data.category_id,
                    address: profRes.data.address || '',
                    phone: profRes.data.phone || '',
                    logo: null
                });
            } catch (err) {
                if (err.response?.status === 404) {
                    setProfile(null);
                    setProfileForm({ ...profileForm, name: user.name + ' Kft.' });
                }
            }

            const slotsRes = await api.get('/companies/my/slots');
            setSlots(slotsRes.data);

            const aptRes = await api.get('/appointments/my');
            setAppointments(aptRes.data);

            const srvRes = await api.get('/companies/my/services');
            setServices(srvRes.data);

        } catch (error) {
            console.error('Hiba az adatok lekérésekor', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileForm({ ...profileForm, logo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profileForm.name);
            formData.append('description', profileForm.description);
            formData.append('category_id', profileForm.category_id);
            formData.append('address', profileForm.address);
            formData.append('phone', profileForm.phone);
            if (profileForm.logo) {
                formData.append('logo', profileForm.logo);
            }

            if (profile) {
                await api.put(`/companies/${profile.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Profil sikeresen frissítve!');
            } else {
                await api.post('/companies', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Profil sikeresen létrehozva!');
            }
            setIsEditingProfile(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Hiba a profil mentésekor');
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            await api.post('/companies/slots/add', {
                slot_date: newDate,
                start_time: newStartTime,
                end_time: newEndTime
            });
            fetchData();
            setNewDate('');
            setNewStartTime('');
            setNewEndTime('');
        } catch (err) {
            alert(err.response?.data?.error || 'Hiba az időpont hozzáadásakor');
        }
    };

    const handleRetractSlot = async (id) => {
        if (!window.confirm('Biztosan törlöd ezt a szabad időpontot?')) return;
        try {
            await api.delete(`/companies/slots/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Hiba a törlés során');
        }
    };

    const updateAppointmentStatus = async (id, status) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert('Hiba a státusz frissítésekor');
        }
    };

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            await api.post('/companies/services', {
                name: newServiceName,
                price: newServicePrice || 0,
                duration_minutes: newServiceDuration || 30,
                description: newServiceDesc
            });
            fetchData();
            setNewServiceName('');
            setNewServicePrice('');
            setNewServiceDuration('30');
            setNewServiceDesc('');
        } catch (err) {
            alert(err.response?.data?.error || 'Hiba a szolgáltatás hozzáadásakor');
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Biztosan törlöd ezt a szolgáltatást?')) return;
        try {
            await api.delete(`/companies/services/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || 'Hiba a szolgáltatás törlésekor');
        }
    };

    if (loading) return <div className="p-8 text-center pt-24 text-gray-500">Adatok betöltése...</div>;

    // Ha még nincs profilja, vagy szerkeszteni akarja
    if (!profile || isEditingProfile) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-6 border-b pb-4">
                        <Building2 className="w-8 h-8 text-primary-600" />
                        <h2 className="text-2xl font-bold text-gray-900">
                            {profile ? 'Céges profil szerkesztése' : 'Állítsd be a céged profilját'}
                        </h2>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-6">

                        {/* Kép feltöltő komponens */}
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 group">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Cég logó" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-slate-400 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="Kattints profilkép kiválasztásához"
                                />
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-lg font-bold text-slate-800">Céges logó / Profilkép</h3>
                                <p className="text-sm text-slate-500 mb-2">Maximum 3MB, JPG formátum. Így fognak látni az ügyfelek a keresésben.</p>
                                <button type="button" className="text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg">Kép kiválasztása...</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cégnév / Szolgáltató neve *</label>
                                <input type="text" required value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategória *</label>
                                <select required value={profileForm.category_id} onChange={e => setProfileForm({ ...profileForm, category_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
                                    <option value="">Válassz kategóriát...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cím / Helyszín</label>
                                <input type="text" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="Pl. 1011 Bp, Fő utca 1." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám</label>
                                <input type="text" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" placeholder="+36 30 123 4567" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rövid bemutatkozó / Leírás</label>
                            <textarea value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none h-32" placeholder="Írd le, mivel foglalkozol, mik a főbb szolgáltatásaid..."></textarea>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-primary-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-primary-700 transition flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" /> Mentés
                            </button>
                            {profile && (
                                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
                                    Mégsem
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Alap Dashboard nézet
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

            {/* Profil fejléc */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                    {profile.logo_url ? (
                        <img src={`http://localhost:3001${profile.logo_url}`} alt="Logo" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-slate-100" />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-primary-100">
                            {profile.category_icon || '🏢'}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.name}</h1>
                            <span className="bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">{profile.category_name}</span>
                        </div>
                        <p className="text-gray-500 font-medium max-w-xl truncate">{profile.description || 'Nincs még megadva leírás a céghez.'}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Settings className="w-5 h-5" /> Szerkesztés
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bal oldali oszlop: Szolgáltatások és Szabad időpontok kezelése */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Szolgáltatások szekció */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" /> Szolgáltatásaim
                        </h2>

                        <form onSubmit={handleAddService} className="space-y-3 mb-6 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
                            <div>
                                <input type="text" required placeholder="Szolgáltatás neve (pl. Hajvágás)" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="relative">
                                        <input type="number" placeholder="Ár" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">Ft</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="relative">
                                        <input type="number" placeholder="Perc" value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">perc</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2 text-sm rounded-md hover:bg-indigo-700 transition flex items-center justify-center gap-1">
                                <Plus className="w-4 h-4" /> Új szolgáltatás
                            </button>
                        </form>

                        {services.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-2">Még nem adtál meg szolgáltatást.</p>
                        ) : (
                            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {services.map(s => (
                                    <li key={s.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-indigo-200 transition-colors">
                                        <div className="text-sm">
                                            <div className="font-bold text-gray-800">{s.name}</div>
                                            <div className="text-gray-500">{s.price} Ft • {s.duration_minutes} perc</div>
                                        </div>
                                        <button onClick={() => handleDeleteService(s.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition" title="Törlés">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary-600" /> Új szabad időpont
                        </h2>
                        <form onSubmit={handleAddSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dátum</label>
                                <input type="date" required value={newDate} min={new Date().toISOString().split('T')[0]} onChange={e => setNewDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kezdés</label>
                                    <input type="time" required value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vége</label>
                                    <input type="time" required value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary-600 text-white font-medium py-2 rounded-md hover:bg-primary-700 transition">
                                Hozzáadás
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-gray-600" /> Aktuális szabad időpontok
                        </h2>
                        {slots.filter(s => !s.is_booked).length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">Nincsenek aktív szabad időpontjaid.</p>
                        ) : (
                            <ul className="space-y-3">
                                {slots.filter(s => !s.is_booked).map(slot => (
                                    <li key={slot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="text-sm">
                                            <div className="font-bold text-gray-800">{new Date(slot.slot_date).toLocaleDateString('hu-HU')}</div>
                                            <div className="text-gray-600">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</div>
                                        </div>
                                        <button onClick={() => handleRetractSlot(slot.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="Törlés">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Jobb oldali oszlop: Beérkezett foglalások */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden min-h-[500px]">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                            <Users className="w-5 h-5 text-primary-600" /> Ugyfelek Foglalásai
                        </h2>

                        {appointments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>Még nem érkezett foglalásod ügyfelektől.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                                {appointments.map(apt => (
                                    <div key={apt.id} className={`p-5 border rounded-xl transition-all ${apt.status === 'pending' ? 'border-primary-200 bg-primary-50 shadow-sm' :
                                        apt.status === 'confirmed' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                                        }`}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{apt.user_name}</h3>
                                                <p className="text-sm text-gray-600 mb-3">{apt.user_email}</p>
                                                <div className="flex flex-wrap gap-3">
                                                    <span className="flex items-center gap-1 text-sm font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100 text-gray-700">
                                                        <CalendarIcon className="w-4 h-4 text-primary-500" /> {new Date(apt.slot_date).toLocaleDateString('hu-HU')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-sm font-medium bg-white px-2 py-1 rounded shadow-sm border border-gray-100 text-gray-700">
                                                        <Clock className="w-4 h-4 text-primary-500" /> {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                                                    </span>
                                                    {apt.service_name && (
                                                        <span className="flex items-center gap-1 text-sm font-bold bg-indigo-50 px-2.5 py-1 rounded shadow-sm border border-indigo-100 text-indigo-700">
                                                            <Briefcase className="w-4 h-4 text-indigo-500" /> {apt.service_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {apt.notes && (
                                                    <div className="mt-3 p-3 bg-white bg-opacity-60 rounded border border-gray-200 text-sm text-gray-700">
                                                        <strong>Megjegyzés:</strong> {apt.notes}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                {apt.status === 'pending' ? (
                                                    <>
                                                        <button onClick={() => updateAppointmentStatus(apt.id, 'confirmed')} className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-1 transition shadow-sm">
                                                            <CheckCircle className="w-4 h-4" /> Jóváhagyás
                                                        </button>
                                                        <button onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-1 transition shadow-sm">
                                                            <XCircle className="w-4 h-4" /> Elutasítás
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`w-full text-center px-4 py-2 rounded-lg text-sm font-bold ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {apt.status === 'confirmed' ? 'Jóváhagyva' : 'Elutasítva/Lemondva'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
