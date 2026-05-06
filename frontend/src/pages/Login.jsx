import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Hiba történt a bejelentkezés során.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                        <LogIn className="h-8 w-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Üdv újra itt!</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Kérjük, jelentkezz be a fiókodba a folytatáshoz.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail cím</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="pelda@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jelszó</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white ${isLoading ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors shadow-md`}
                        >
                            {isLoading ? 'Bejelentkezés folyamatban...' : 'Bejelentkezés'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Még nincs fiókod?{' '}
                        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                            Regisztrálj most
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
