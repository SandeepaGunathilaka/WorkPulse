import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Lock, AlertCircle, Users, Shield } from 'lucide-react';
import { mockLogin } from '../utils/mockAuth';
import bg from '/login.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ Email validation function
  const validateEmail = (email) => {
    if (!email.includes('@')) return false;
    if (email.length > 254) return false;

    const [localPart, domainPart = ''] = email.split('@');
    if (localPart.length > 64) return false;
    if (domainPart.length > 253) return false;

    const emailRegex = /^[a-z0-9.]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  };

  // ✅ Handle email input (filter characters + enforce length)
  const handleEmailChange = (e) => {
    let newValue = e.target.value;

    // Allow only letters, numbers, @, and .
    newValue = newValue.replace(/[^a-zA-Z0-9@.]/g, '');

    // Prevent more than one "@"
    const atCount = (newValue.match(/@/g) || []).length;
    if (atCount > 1) {
      newValue = newValue.slice(0, newValue.lastIndexOf('@'));
    }

    // Convert to lowercase
    newValue = newValue.toLowerCase();

    // Enforce max length (254 total, 64 before "@")
    if (newValue.length > 254) newValue = newValue.slice(0, 254);
    const [localPart, domainPart = ''] = newValue.split('@');
    if (localPart.length > 64) {
      newValue = localPart.slice(0, 64) + (domainPart ? `@${domainPart}` : '');
    }

    setEmail(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ Validate email before submitting
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleQuickLogin = async (role) => {
    console.log('🚀 Quick login initiated for role:', role);
    const { user, token } = mockLogin(role);
    setError('');

    try {
      const mockLoginResponse = {
        success: true,
        token: token,
        user: user
      };

      const result = await login('', '', mockLoginResponse);

      if (result.success) {
        const targetPath = role === 'admin' ? '/admin' :
                          role === 'hr' ? '/hr' :
                          role === 'manager' ? '/manager' :
                          role === 'employee' ? '/employee' : '/';

        console.log('🎯 Target path:', targetPath);
        navigate(targetPath);
      }
    } catch (error) {
      console.error('Quick login error:', error);
      window.dispatchEvent(new Event('localStorage-changed'));
      setTimeout(() => {
        const targetPath = role === 'admin' ? '/admin' :
                          role === 'hr' ? '/hr' :
                          role === 'manager' ? '/manager' :
                          role === 'employee' ? '/employee' : '/';
        navigate(targetPath);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100vh',
      }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-teal-700/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-6xl items-center justify-between">
          {/* Left Side - Welcome Text */}
          <div className="hidden lg:flex flex-col text-white max-w-xl pr-12">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Welcome to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                  WorkPulse
                </span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Your comprehensive hospital employee management system. 
                Streamline operations, enhance productivity, and ensure excellent patient care.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-cyan-300" />
                </div>
                <span className="text-blue-100">Staff Management & Scheduling</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-teal-300" />
                </div>
                <span className="text-blue-100">Secure Data Handling</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-300" />
                </div>
                <span className="text-blue-100">Multi-Department Coordination</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6 border border-white/20">
              <div className="text-center">
                <div className="mx-auto w-80 h-24 mb-6 p-3 bg-white rounded-xl shadow-lg border border-gray-100">
                  <img
                    src="/Logo.png?v=1"
                    alt="WorkPulse Logo"
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.error('Logo failed to load:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 font-medium">Hospital Employee Management System</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/90"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/90"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      id="remember"
                    />
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          <a href="/contact-hr" className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
          Need help? Contact your HR department
             </a>

      </div>

            </div>

            {/* Mobile Welcome Text */}
            <div className="lg:hidden text-center text-white mt-6 px-4">
              <p className="text-blue-100">
                Comprehensive hospital employee management system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-300/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-teal-300/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-300/10 rounded-full blur-xl animate-pulse delay-500"></div>
    </div>
  );
};

export default Login;
