import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config";

function Settings() {
  const [settings, setSettings] = useState(null);
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // حالة كلمات المرور
  const [passwords, setPasswords] = useState({ adminPassword: "", circles: {} });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, circlesRes] = await Promise.all([
        axios.get(`${API_BASE}/settings`),
        axios.get(`${API_BASE}/circles`),
      ]);
      setSettings(settingsRes.data);
      setCircles(circlesRes.data);
      
      const initialCirclesPass = {};
      circlesRes.data.forEach(c => { initialCirclesPass[c._id] = ""; });
      setPasswords({ adminPassword: "", circles: initialCirclesPass });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleGradeChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      grades: { ...prev.grades, [field]: parseInt(value) || 0 }
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/settings`, { grades: settings.grades });
      alert("تم حفظ الدرجات بنجاح!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("فشل حفظ الدرجات");
    } finally {
      setLoading(false);
    }
  };

  const savePasswords = async () => {
    setLoading(true);
    try {
      const payload = {
        adminPassword: passwords.adminPassword || null,
        circles: Object.entries(passwords.circles)
          .filter(([id, pass]) => pass.trim() !== "")
          .map(([id, pass]) => ({ id, password: pass }))
      };
      
      if (!payload.adminPassword) delete payload.adminPassword;

      await axios.put(`${API_BASE}/settings/passwords`, payload);
      alert("تم تحديث كلمات المرور بنجاح!");
      
      // تصفير الحقول بعد الحفظ
      const resetPasses = {};
      circles.forEach(c => { resetPasses[c._id] = ""; });
      setPasswords({ adminPassword: "", circles: resetPasses });
    } catch (error) {
      console.error("Error saving passwords:", error);
      alert("فشل تحديث كلمات المرور");
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <div className="text-center py-20 font-bold text-emerald-700">جاري التحميل...</div>;

  // الحقول السبعة الأساسية فقط (بدون أي كميات)
  const fields = [
    { key: "textGradeMax", label: "درجة النص (القصوى)" },
    { key: "surahGradeMax", label: "درجة السورة (القصوى)" },
    { key: "recentPastGradeMax", label: "درجة الماضي القريب (القصوى)" },
    { key: "distantPastGradeMax", label: "درجة الماضي البعيد (القصوى)" },
    { key: "tajweedGradeMax", label: "درجة التجويد (القصوى)" },
    { key: "behaviorGradeMax", label: "درجة السلوك (القصوى)" },
    { key: "commitmentGradeMax", label: "درجة الالتزام (القصوى)" },
  ];

  const maxTotal = Object.values(settings.grades).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-emerald-800">الإعدادات</h1>
        <p className="text-gray-500 text-sm mt-1">إدارة الدرجات وكلمات المرور</p>
      </div>

      {/* قسم الدرجات */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-bold text-emerald-800 border-b pb-2">نظام توزيع الدرجات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <label className="font-semibold text-gray-700 text-sm">{field.label}</label>
              <input 
                type="number" min="0" max="50"
                value={settings.grades[field.key] || 0}
                onChange={(e) => handleGradeChange(field.key, e.target.value)}
                className="w-20 p-2 rounded-lg border border-gray-200 text-center font-bold text-emerald-700 outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
        
        <div className="p-4 rounded-xl bg-emerald-50 text-center flex items-center justify-center gap-2">
          <span className="text-sm text-gray-600">الحد الأقصى الكلي للحصة:</span>
          <span className="font-bold text-emerald-800 text-xl">{maxTotal}</span>
          <span className="text-sm text-gray-600">درجة</span>
        </div>
        
        <button onClick={saveSettings} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold mt-2 transition-all">
          {loading ? "جارٍ الحفظ..." : "حفظ الدرجات"}
        </button>
      </div>

      {/* قسم كلمات المرور */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-bold text-emerald-800 border-b pb-2">إدارة كلمات المرور (للمدير فقط)</h2>
        <p className="text-xs text-gray-500">اترك الحقل فارغاً إذا كنت لا تريد تغيير كلمة المرور الحالية.</p>
        
        {/* باسورد المدير */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <label className="block font-bold text-amber-800 mb-2">كلمة مرور المدير</label>
          <input 
            type="password" placeholder="أدخل كلمة المرور الجديدة..."
            value={passwords.adminPassword}
            onChange={(e) => setPasswords({ ...passwords, adminPassword: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-amber-300 outline-none focus:border-amber-500 bg-white"
          />
        </div>

        {/* باسوردات الحلقات */}
        <div className="space-y-2 mt-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2">كلمات مرور المعلمين (الحلقات):</h3>
          {circles.map(c => (
            <div key={c._id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <label className="font-semibold text-gray-700 flex-1 text-sm">{c.name}</label>
              <input 
                type="password" placeholder="كلمة مرور جديدة..."
                value={passwords.circles[c._id] || ""}
                onChange={(e) => setPasswords({ 
                  ...passwords, 
                  circles: { ...passwords.circles, [c._id]: e.target.value } 
                })}
                className="w-full md:w-64 p-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>

        <button onClick={savePasswords} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold mt-2 transition-all">
          {loading ? "جارٍ الحفظ..." : "حفظ كلمات المرور"}
        </button>
      </div>
    </div>
  );
}

export default Settings;
