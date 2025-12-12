import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../services/httpClient';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        university: 'SCA',
        roll_no: 'ADMIN',
        full_name: 'System Administrator',
        password: 'admin2025'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Admin login
            const response = await request<{ access_token: string }>('http://localhost:8000/auth/login', {
                method: 'POST',
                body: formData,
                skipAuth: true
            });

            // Save token and admin info
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('admin', JSON.stringify({
                university: formData.university,
                roll_no: formData.roll_no,
                full_name: formData.full_name,
                is_admin: true
            }));

            // Clear any student data
            localStorage.removeItem('student');

            // Redirect to admin dashboard
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Admin login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl mb-4 border border-red-500/30">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                    <p className="text-white/70">System Administrator Access</p>
                </div>

                {/* Admin Login Card */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* University */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                University
                            </label>
                            <select
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                required
                            >
                                <option value="SCA" className="bg-gray-900">Smart Campus Academy</option>
                                <option value="MIT" className="bg-gray-900">MIT</option>
                                <option value="STAN" className="bg-gray-900">Stanford</option>
                            </select>
                        </div>

                        {/* Admin Username */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Admin Username
                            </label>
                            <input
                                type="text"
                                name="roll_no"
                                value={formData.roll_no}
                                onChange={handleChange}
                                placeholder="ADMIN"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Administrator Name"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        {/* Admin Access Code */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Admin Access Code
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter admin access code"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                required
                            />
                            <p className="mt-2 text-xs text-white/60">
                                Default admin code: <span className="font-mono text-red-300">admin2025</span>
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Warning Box */}
                        <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-xs text-orange-200">
                                    <strong>Admin Access:</strong> This portal is for system administrators only. Unauthorized access is prohibited.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Admin Login
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            ← Back to Student Login
                        </Link>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/60 text-center">
                        🔐 All admin actions are logged and monitored for security
                    </p>
                </div>
            </div>
        </div>
    );
}
