import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config";

function Login({ onLogin }) {
  const [circles, setCircles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/circles`).then((res) => {
      if (Array.isArray(res.data)) setCircles(res.data);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const payload = {
        role: selectedRole === "admin" ? "admin" : "circle",
        password,
        circleId: selectedRole !== "admin" ? selectedRole : null
      };
      
      const res = await axios.post(`${API_BASE}/login`, payload);
      if (res.data.success) {
        onLogin(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "فشل تسجيل الدخول، تأكد من البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-4 relative overflow-hidden">
      {/* خلفيات جمالية */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 w-full max-w-md rounded-3xl shadow-2xl border border-white/50 relative z-10">
        
        <div className="text-center mb-8">
          {/* ⭐ صورة التطبيق */}
          <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg border-4 border-emerald-100 overflow-hidden mb-4 flex items-center justify-center">
            <img 
              src={`${process.env.PUBLIC_URL}/icons/icon-192x192.png`} 
              alt="شعار مجمع أهل القرآن" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-4xl text-emerald-800 font-bold font-amiri">ق</span>';
              }}
            />
          </div>
          
          {/* ⭐ اسم التطبيق */}
          <h1 className="font-amiri text-3xl md:text-4xl font-bold text-emerald-900 mb-2">
            مجمع أهل القرآن
          </h1>
          <p className="text-gray-500 text-sm">مرحباً بك، يرجى تسجيل الدخول للمتابعة</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">
              تسجيل الدخول كـ
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none text-right"
                dir="rtl"
              >
                <option value="admin">👑 المدير (كل الحلقات)</option>
                {circles.map((c) => (
                  <option key={c._id} value={c._id}>🎓 {c.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="text-gray-400">▼</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-right placeholder-gray-400"
                dir="ltr"
                required
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔒</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                جارٍ الدخول...
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} مجمع أهل القرآن. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
