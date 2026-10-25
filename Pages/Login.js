import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "../utils";
import { api } from "@/api/localDataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Leaf, Mail, Lock, Eye, EyeOff, Loader2, User, ArrowRight,
  Shield, Users, ChevronLeft, Check
} from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from a specific portal request
  const searchParams = new URLSearchParams(location.search);
  const requestedPortal = searchParams.get('portal'); // 'visitor' or 'staff'

  const [loginType, setLoginType] = useState(requestedPortal || null); // null = selection screen, 'visitor', 'staff'
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Check if already logged in
  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      // Check for staff session first
      const staffUser = await api.adminAuth.getCurrentUser();
      if (staffUser) {
        // If requesting staff portal or already staff, go to admin
        if (requestedPortal === 'staff' || !requestedPortal) {
          navigate('/admin');
          return;
        }
      }
    } catch (e) {
      // Not logged in as staff
    }

    try {
      // Check for visitor session
      const visitorUser = await api.auth.getCurrentUser();
      if (visitorUser) {
        // If requesting visitor portal or no specific request, go home
        if (requestedPortal === 'visitor' || !requestedPortal) {
          navigate(createPageUrl("Home"));
          return;
        }
      }
    } catch (e) {
      // Not logged in as visitor
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === 'staff') {
        // Staff login
        const staff = await api.adminAuth.login(formData.email, formData.password, rememberMe);
        toast.success(`Welcome back, ${staff.name}!`);
        navigate("/admin");
      } else {
        // Visitor login/register
        if (isLogin) {
          await api.auth.login(formData.email, formData.password, rememberMe);
          toast.success("Welcome back!");
        } else {
          await api.auth.register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }, rememberMe);
          toast.success("Account created successfully!");
        }
        navigate(createPageUrl("Home"));
      }
    } catch (error) {
      toast.error(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Portal Selection Screen
  if (!loginType) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2D5016] to-[#4A7C23] items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white max-w-md"
          >
            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
              <Leaf className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Gracia</h1>
            <p className="text-white/80 text-lg mb-8">
              Your digital companion for exploring our sustainable farm and visitor centre.
            </p>
            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                "Discover Events",
                "Explore Activities",
                "Find Shops & Cafés",
                "AI-Powered Guide",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Portal Selection */}
        <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-stone-900">Gracia</h1>
            </div>

            {/* Selection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-stone-900">Welcome</h2>
                <p className="text-stone-500 mt-2">
                  Choose how you'd like to sign in
                </p>
              </div>

              <div className="space-y-4">
                {/* Visitor Option */}
                <button
                  onClick={() => setLoginType('visitor')}
                  className="w-full p-6 rounded-xl border-2 border-stone-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2D5016]/10 flex items-center justify-center group-hover:bg-[#2D5016]/20 transition-colors">
                      <Users className="w-6 h-6 text-[#2D5016]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 mb-1">Visitor</h3>
                      <p className="text-sm text-stone-500">
                        Explore events, activities, and book your farm experience
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#2D5016] transition-colors mt-1" />
                  </div>
                </button>

                {/* Staff Option */}
                <button
                  onClick={() => setLoginType('staff')}
                  className="w-full p-6 rounded-xl border-2 border-stone-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2D5016]/10 flex items-center justify-center group-hover:bg-[#2D5016]/20 transition-colors">
                      <Shield className="w-6 h-6 text-[#2D5016]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 mb-1">Staff</h3>
                      <p className="text-sm text-stone-500">
                        Access the admin dashboard to manage content
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[#2D5016] transition-colors mt-1" />
                  </div>
                </button>
              </div>

              {/* Continue as Guest */}
              <div className="mt-8 text-center">
                <Link
                  to={createPageUrl("Home")}
                  className="text-sm text-stone-500 hover:text-[#2D5016] transition-colors"
                >
                  Continue as guest
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Login Form Screen
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2D5016] to-[#4A7C23] items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white max-w-md"
        >
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8">
            {loginType === 'staff' ? (
              <Shield className="w-12 h-12" />
            ) : (
              <Leaf className="w-12 h-12" />
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {loginType === 'staff' ? 'Staff Portal' : 'Welcome to Gracia'}
          </h1>
          <p className="text-white/80 text-lg mb-8">
            {loginType === 'staff'
              ? 'Manage events, activities, and content for Gracia Farm.'
              : 'Your digital companion for exploring our sustainable farm and visitor centre.'
            }
          </p>
          {loginType === 'visitor' && (
            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                "Discover Events",
                "Explore Activities",
                "Find Shops & Cafés",
                "AI-Powered Guide",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  {feature}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <button
            onClick={() => setLoginType(null)}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to selection</span>
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center mx-auto mb-4">
              {loginType === 'staff' ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <Leaf className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-stone-900">
              {loginType === 'staff' ? 'Staff Portal' : 'Gracia'}
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D5016]/10 text-[#2D5016] text-sm font-medium mb-4">
                {loginType === 'staff' ? (
                  <>
                    <Shield className="w-4 h-4" />
                    Staff Login
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Visitor Login
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold text-stone-900">
                {loginType === 'staff'
                  ? 'Sign In'
                  : isLogin ? "Welcome Back" : "Create Account"
                }
              </h2>
              <p className="text-stone-500 mt-2">
                {loginType === 'staff'
                  ? 'Access the admin dashboard'
                  : isLogin
                    ? "Sign in to access your visitor experience"
                    : "Join us and start exploring Gracia"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {loginType === 'visitor' && !isLogin && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="pl-11"
                      required={loginType === 'visitor' && !isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={loginType === 'staff' ? "staff@gracia.farm" : "you@example.com"}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="pl-11 pr-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      rememberMe
                        ? 'bg-[#2D5016] border-[#2D5016]'
                        : 'border-stone-300 hover:border-stone-400'
                    }`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-stone-600">Remember me</span>
                </label>
                {isLogin && (
                  <button
                    type="button"
                    className="text-sm text-[#2D5016] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2D5016] hover:bg-[#4A7C23] h-12"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {loginType === 'staff'
                      ? 'Sign In to Dashboard'
                      : isLogin ? "Sign In" : "Create Account"
                    }
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Register for Visitors */}
            {loginType === 'visitor' && (
              <div className="mt-6 text-center">
                <p className="text-stone-500">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[#2D5016] font-medium ml-2 hover:underline"
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </button>
                </p>
              </div>
            )}

            {/* Demo Credentials for Staff */}
            {loginType === 'staff' && (
              <div className="mt-6 p-4 bg-stone-50 rounded-xl">
                <p className="text-sm font-medium text-stone-700 mb-2">Demo Credentials:</p>
                <div className="space-y-1 text-sm text-stone-500">
                  <p><span className="font-medium">Admin:</span> admin@gracia.farm / admin123</p>
                </div>
              </div>
            )}
          </div>

          {/* Continue as Guest (for visitors only) */}
          {loginType === 'visitor' && (
            <div className="mt-6 text-center">
              <Link
                to={createPageUrl("Home")}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Continue as guest
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
