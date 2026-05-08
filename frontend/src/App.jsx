import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/layout/ProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import CompanyList from './pages/CompanyList';
import CompanyProfile from './pages/CompanyProfile';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/company/:id" element={<CompanyProfile />} />

          <Route path="/user/dashboard" element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } />

          <Route path="/company/dashboard" element={
            <ProtectedRoute allowedRole="company">
              <CompanyDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <footer className="bg-gray-900 text-white text-center py-6">
      </footer>
    </div>
  );
}

export default App;
