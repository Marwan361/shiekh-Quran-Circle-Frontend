import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { API_BASE } from "../config";

function Dashboard({ circleId }) {
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalStudents: 0,
    sessionsThisMonth: 0,
    avgScore: 0,
    inPersonCount: 0,
    onlineCount: 0,
    pausedCount: 0,
  });
  const [recentSessions, setRecentSessions] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [studentsRes, sessionsRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE}/students?circleId=${circleId}`),
        axios.get(`${API_BASE}/sessions?circleId=${circleId}`),
        axios.get(`${API_BASE}/settings`),
      ]);

      const allStudents = studentsRes.data;
      const students = allStudents.filter((s) => s.status !== "paused");
      const pausedCount = allStudents.length - students.length;

      const sessions = sessionsRes.data;
      const settings = settingsRes.data;

      const now = new Date();
      const sessionsThisMonth = sessions.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      });

      const inPerson = students.filter((s) => s.type === "inperson");
      const online = students.filter((s) => s.type === "online");

      let totalScores = 0;
      let totalEvals = 0;
      const activeStudentIds = new Set(students.map((s) => String(s._id)));

      sessionsThisMonth.forEach((session) => {
        session.evaluations.forEach((ev) => {
          if (!activeStudentIds.has(String(ev.studentId))) return;

          if (ev.attendance === "present") {
            const memQ = parseFloat(ev.memQuality) || 0;
            const revQ = parseFloat(ev.revQuality) || 0;
            const taj = parseFloat(ev.tajweed) || 0;
            const les = parseFloat(ev.lesson) || 0;
            const beh = parseFloat(ev.behavior) || 0;

            totalScores += beh + memQ + revQ + taj + les;
            totalEvals++;
          }
          // المعتذر والغائب لا يأخذون درجات
        });
      });

      setStats({
        activeStudents: students.length,
        totalStudents: allStudents.length,
        sessionsThisMonth: sessionsThisMonth.length,
        avgScore: totalEvals > 0 ? totalScores / totalEvals : 0,
        inPersonCount: inPerson.length,
        onlineCount: online.length,
        pausedCount,
      });

      setRecentSessions(sessions.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [circleId]);

  useEffect(() => {
    if (circleId) {
      fetchDashboardData();
    }
  }, [circleId, fetchDashboardData]);

  const exportPDF = () => {
    const element = document.getElementById("dashboard-pdf");
    html2pdf()
      .set({
        margin: 10,
        filename: "لوحة-التحكم.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            لوحة التحكم
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            نظرة عامة على أداء الحلقة والطلاب والحصص هذا الشهر
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="btn-outline flex items-center gap-2 text-sm">
          📄 تصدير PDF
        </button>
      </div>

      <div id="dashboard-pdf" className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-4 text-center hover:shadow-xl transition-all">
            <div className="text-3xl mb-1">🎓</div>
            <div className="text-2xl font-bold text-emerald-800">
              {stats.activeStudents}
            </div>
            <div className="text-xs text-gray-500 mt-1">طالب نشط</div>
            {stats.pausedCount > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                ({stats.pausedCount} موقوف)
              </div>
            )}
          </div>
          <div className="glass p-4 text-center hover:shadow-xl transition-all">
            <div className="text-3xl mb-1">📚</div>
            <div className="text-2xl font-bold text-emerald-800">
              {stats.sessionsThisMonth}
            </div>
            <div className="text-xs text-gray-500 mt-1">حصة هذا الشهر</div>
          </div>
          <div className="glass p-4 text-center hover:shadow-xl transition-all">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-2xl font-bold text-emerald-800">
              {stats.avgScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">متوسط الدرجات</div>
          </div>
          <div className="glass p-4 text-center hover:shadow-xl transition-all">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-emerald-800">
              {stats.inPersonCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              حضوري | {stats.onlineCount} أونلاين
            </div>
          </div>
        </div>

        <div className="glass p-5">
          <h3 className="font-bold text-lg text-emerald-800 mb-3">
            آخر الحصص المسجلة
          </h3>
          {recentSessions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              لا توجد حصص مسجلة بعد
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-gray-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-emerald-800">
                      {session.name || session.date}
                    </span>
                    <span className="text-sm text-gray-500">
                      {session.date}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {session.evaluations.length} طالب
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
