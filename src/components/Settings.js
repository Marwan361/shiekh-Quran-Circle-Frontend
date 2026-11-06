import React, { useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { API_BASE } from "../config";

function Settings() {
  const [settings, setSettings] = useState({
    grades: {
      textGradeMax: 10,
      surahGradeMax: 10,
      recentPastGradeMax: 10,
      distantPastGradeMax: 10,
      tajweedGradeMax: 10,
      behaviorGradeMax: 10,
      commitmentGradeMax: 10,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/settings`, settings);
      alert("تم حفظ الإعدادات بنجاح!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const element = document.getElementById("settings-pdf");
    html2pdf()
      .set({
        margin: 10,
        filename: "الإعدادات.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  // حساب المجموع الكلي الأقصى من الحقول الجديدة
  const maxTotal = Object.values(settings.grades).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            الإعدادات
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            عدّل نظام توزيع الدرجات (الدرجة القصوى لكل بند)
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="btn-outline flex items-center gap-2 text-sm">
          📄 PDF
        </button>
      </div>

      <div id="settings-pdf" className="glass p-6 max-w-lg">
        <h3 className="font-bold text-lg text-emerald-800 mb-4">
          نظام توزيع الدرجات
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة النص (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.textGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    textGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة السورة (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.surahGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    surahGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة الماضي القريب (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.recentPastGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    recentPastGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة الماضي البعيد (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.distantPastGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    distantPastGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة التجويد (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.tajweedGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    tajweedGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة السلوك (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.behaviorGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    behaviorGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              درجة الالتزام (القصوى)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={settings.grades.commitmentGradeMax}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  grades: {
                    ...settings.grades,
                    commitmentGradeMax: parseInt(e.target.value) || 0,
                  },
                })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 text-center">
            <span className="text-sm text-gray-500">
              الحد الأقصى الكلي للحصة:
            </span>
            <span className="font-bold text-emerald-800 text-lg mx-1">
              {maxTotal}
            </span>
            <span className="text-sm text-gray-500"> درجة</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-emerald w-full">
            {loading ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
