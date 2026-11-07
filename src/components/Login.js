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
        onLogin(res.data); // بنبعت البيانات لـ App.js
      }
    } catch (err) {
      setError(err.response?.data?.error || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="glass p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto rounded-full gold-bg-gradient flex items-center justify-center text-4xl mb-4 font-amiri text-emerald-900 font-bold">
          ق
        </div>
        <h1 className="font-amiri text-2xl font-bold text-emerald-800 mb-6">
          حلقة القرآن
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1 text-right">الدخول كـ</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
            >
              <option value="admin">المدير (كل الحلقات)</option>
              {circles.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1 text-right">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-center"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="btn-emerald w-full py-3 text-lg mt-4"
          >
            {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
