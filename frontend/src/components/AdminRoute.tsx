import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface AdminRouteProps {
    children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
    const token = localStorage.getItem('token');
    const adminData = localStorage.getItem('admin');

    // No token → redirect to admin login
    if (!token) {
        return <Navigate to="/admin-login" replace />;
    }

    // Check if admin data exists
    if (!adminData) {
        // Token exists but no admin data → redirect to admin login
        localStorage.removeItem('token');
        return <Navigate to="/admin-login" replace />;
    }

    try {
        const admin = JSON.parse(adminData);

        // Verify is_admin flag
        if (admin.is_admin !== true) {
            // Not an admin, redirect to student login
            localStorage.removeItem('token');
            localStorage.removeItem('admin');
            return <Navigate to="/login" replace />;
        }

        // Valid admin, render protected content
        return <>{children}</>;
    } catch (e) {
        // Invalid admin data, clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        return <Navigate to="/admin-login" replace />;
    }
}
