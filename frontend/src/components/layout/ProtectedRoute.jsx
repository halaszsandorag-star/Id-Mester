import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Betöltés...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
