import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem('token');
    const studentData = localStorage.getItem('student');
    const adminData = localStorage.getItem('admin');

    // No token → redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If admin is logged in, don't allow access to student routes
    if (adminData) {
        try {
            const admin = JSON.parse(adminData);
            if (admin.is_admin === true) {
                return <Navigate to="/admin" replace />;
            }
        } catch (e) {
            // Invalid admin data, clear and redirect
            localStorage.removeItem('admin');
        }
    }

    // Check if student data exists
    if (!studentData) {
        // Token exists but no student data → redirect to login
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    try {
        const student = JSON.parse(studentData);

        // If marked as admin, redirect to admin
        if (student.is_admin === true) {
            return <Navigate to="/admin" replace />;
        }

        // Valid student, render protected content
        return <>{children}</>;
    } catch (e) {
        // Invalid student data, clear and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('student');
        return <Navigate to="/login" replace />;
    }
}
