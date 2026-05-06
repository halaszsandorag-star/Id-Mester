import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/axios';

const UserDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments/my');
            setAppointments(res.data);
        } catch (error) {
            console.error('Hiba a foglalások lekérésekor', error);
        } finally {
            setLoading(false);
        }
    };

    const cancelAppointment = async (id) => {
        if (!window.confirm('Biztosan lemondod ezt a foglalást?')) return;
        try {
            await api.patch(`/appointments/${id}/status`, { status: 'cancelled' });
            fetchAppointments();
        } catch (error) {
            alert('Hiba a lemondás során');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Elfogadva</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" /> Lemondva</span>;
            default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> Függőben</span>;
        }
    };

    if (loading) return <div className="p-8 text-center pt-24">Betöltés...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
                <User className="h-8 w-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">Saját Foglalásaim</h1>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-100">
                {appointments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg">Még nincs aktív foglalásod.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {appointments.map((apt) => (
                            <li key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{apt.category_icon}</span>
                                            <h3 className="text-xl font-bold text-gray-900">{apt.company_name}</h3>
                                            {getStatusBadge(apt.status)}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <b>{new Date(apt.slot_date).toLocaleDateString('hu-HU')}</b></p>
                                            <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}</p>
                                            <p className="text-gray-500 truncate mt-1 break-all flex items-center gap-2 min-h-6">{apt.company_address}</p>
                                            {apt.service_name && (
                                                <div className="inline-flex mt-2 items-center px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700">
                                                    <span className="font-semibold">{apt.service_name}</span>
                                                    <span className="mx-2 text-indigo-300">•</span>
                                                    <span className="font-bold">{apt.service_price} Ft</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {apt.status !== 'cancelled' && (
                                        <button
                                            onClick={() => cancelAppointment(apt.id)}
                                            className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-md font-medium text-sm transition-colors"
                                        >
                                            Lemondás
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
