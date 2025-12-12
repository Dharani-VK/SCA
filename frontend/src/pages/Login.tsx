import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { request } from '../services/httpClient';

const UNIVERSITIES = [
    { code: 'SCA', name: 'Smart Campus Academy' },
    { code: 'MIT', name: 'Massachusetts Institute of Technology' },
    { code: 'STAN', name: 'Stanford University' }
];

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        university: 'SCA',
        roll_no: 'student_a',
        password: 'password123'
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
            // Login - user must be pre-registered by admin
            const response = await request<{ access_token: string, user: any }>('http://localhost:8000/auth/login', {
                method: 'POST',
                body: {
                    university: formData.university,
                    roll_no: formData.roll_no,
                    password: formData.password
                },
                skipAuth: true
            });

            // Save token and user info
            localStorage.setItem('token', response.access_token);
            const userObj = {
                roll_no: formData.roll_no,
                university: formData.university,
                full_name: response.user?.full_name || '',
                is_admin: false
            };
            localStorage.setItem('student', JSON.stringify(userObj));

            // Redirect to student dashboard
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials or contact your admin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl mb-4 border border-white/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Smart Campus Assistant</h1>
                    <p className="text-white/70">Student Login</p>
                </div>

                {/* Default Credentials Notice */}
                <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-900/40 p-4 text-sm text-blue-100 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-blue-200">For Demonstration Purposes:</p>
                            <p className="mt-1 opacity-90">
                                This form is pre-filled with a default test account.
                                <br />
                                <strong>Username: </strong> student_a <br />
                                <strong>Password: </strong> password123
                            </p>
                            <p className="mt-2 text-xs opacity-75">
                                Please use these credentials to log in. Creating new users requires Admin access. Using other credentials may result in login failure.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* University Selection */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                University
                            </label>
                            <select
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                            >
                                {UNIVERSITIES.map(uni => (
                                    <option key={uni.code} value={uni.code} className="bg-gray-900">
                                        {uni.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Roll Number */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Roll Number
                            </label>
                            <input
                                type="text"
                                name="roll_no"
                                value={formData.roll_no}
                                onChange={handleChange}
                                placeholder="e.g., 001"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                required
                            />
                            <p className="mt-2 text-xs text-white/60">
                                Password provided by your admin
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                                <p className="text-sm text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-6 text-center space-y-2">
                        <p className="text-sm text-white/70">
                            Need to register? Contact your university admin
                        </p>
                        <Link
                            to="/admin-login"
                            className="block text-sm text-purple-300 hover:text-purple-200 transition-colors"
                        >
                            Admin Login →
                        </Link>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                    <p className="text-xs text-white/60 text-center">
                        🔒 Secure multi-tenant authentication with end-to-end data isolation
                    </p>
                </div>
            </div>
        </div>
    );
}
