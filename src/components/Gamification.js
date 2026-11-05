import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { API_BASE } from "../config";

// ⭐ تاريخ الفصل بين النظامين
const CUTOFF_DATE = "2026-10-10";

const isNewSystem = (dateStr) => {
  if (!dateStr) return false;
  return dateStr >= CUTOFF_DATE;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
);

function Gamification({ circleId }) {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reportData, setReportData] = useState(null);
  const [improvementData, setImprovementData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);

  const computeMonthReport = useCallback(
    (sessions, students, settings, year, month) => {
      const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      const monthSessions = sessions.filter((s) =>
        s.date?.startsWith(monthPrefix),
      );

      const maxTotal =
        settings.grades.attendancePresent +
        settings.grades.memQualityMax +
        settings.grades.revQualityMax +
        settings.grades.tajweedMax +
        settings.grades.lessonMax;

      const sessionCount = monthSessions.length;
      const monthMaxTotal = sessionCount * maxTotal;

      const studentReports = students.map((student) => {
        let totalScore = 0;
        let totalMemQty = 0;
        let totalRevQty = 0;
        let presentCount = 0;
        let excusedCount = 0;
        let sumBehavior = 0;
        let sumMemQuality = 0;
        let sumRevQuality = 0;
        let sumTajweed = 0;
        let sumLesson = 0;

        monthSessions.forEach((session) => {
          const ev = session.evaluations.find(
            (e) => String(e.studentId) === String(student._id),
          );
          if (ev) {
            const newSys = isNewSystem(session.date);

            if (ev.attendance === "present") {
              const memQ = parseFloat(ev.memQuality) || 0;
              const revQ = parseFloat(ev.revQuality) || 0;
              const taj = parseFloat(ev.tajweed) || 0;
              const les = parseFloat(ev.lesson) || 0;

              if (newSys) {
                // ⭐ النظام الجديد: السلوك بدل الحضور
                const beh = parseFloat(ev.behavior) || 0;
                totalScore += beh + memQ + revQ + taj + les;
                sumBehavior += beh;
              } else {
                // النظام القديم
                totalScore +=
                  settings.grades.attendancePresent + memQ + revQ + taj + les;
              }

              sumMemQuality += memQ;
              sumRevQuality += revQ;
              sumTajweed += taj;
              sumLesson += les;
              totalMemQty += parseFloat(ev.memQty) || 0;
              totalRevQty += parseFloat(ev.revQty) || 0;
              presentCount++;
            } else if (ev.attendance === "excused" && !newSys) {
              // المعتذر يأخذ درجة الحضور فقط في النظام القديم
              totalScore += settings.grades.attendancePresent;
              excusedCount++;
            } else if (ev.attendance === "excused") {
              // في النظام الجديد: لا درجة للمعتذر
              excusedCount++;
            }
          }
        });

        const percentage =
          monthMaxTotal > 0 ? (totalScore / monthMaxTotal) * 100 : 0;

        return {
          studentId: student._id,
          studentName: student.name,
          studentType: student.type,
          totalScore,
          percentage: Math.round(percentage * 10) / 10,
          totalMemQty,
          totalRevQty,
          presentCount,
          excusedCount,
          sumBehavior,
          sumMemQuality,
          sumRevQuality,
          sumTajweed,
          sumLesson,
          sessionCount,
          rank: null,
        };
      });

      studentReports.sort((a, b) => b.percentage - a.percentage);

      let inpersonRank = 0;
      studentReports.forEach((r) => {
        if (r.studentType === "inperson") {
          inpersonRank++;
          r.rank = inpersonRank;
        }
      });

      return {
        students: studentReports,
        sessionCount,
        monthMaxTotal,
        maxTotal,
        sessions: monthSessions,
      };
    },
    [],
  );

  const computeChartData = useCallback(
    (allSessions, students, settings) => {
      const monthsSet = new Set();
      allSessions.forEach((s) => {
        if (s.date) monthsSet.add(s.date.substring(0, 7));
      });
      const monthsArray = Array.from(monthsSet).sort();

      const labels = [];
      const behaviorArr = [];
      const memQualityArr = [];
      const revQualityArr = [];
      const tajweedArr = [];
      const lessonArr = [];
      const memQtyArr = [];
      const revQtyArr = [];

      monthsArray.forEach((monthStr) => {
        const [year, month] = monthStr.split("-").map(Number);
        const report = computeMonthReport(
          allSessions,
          students,
          settings,
          year,
          month,
        );
        const inpersonReports = report.students.filter(
          (s) => s.studentType === "inperson",
        );
        const count = inpersonReports.length;

        labels.push(monthStr);

        const sumField = (field) =>
          inpersonReports.reduce((acc, s) => acc + s[field], 0);

        behaviorArr.push(
          count > 0
            ? Math.round((sumField("sumBehavior") / count) * 10) / 10
            : 0,
        );
        memQualityArr.push(
          count > 0
            ? Math.round((sumField("sumMemQuality") / count) * 10) / 10
            : 0,
        );
        revQualityArr.push(
          count > 0
            ? Math.round((sumField("sumRevQuality") / count) * 10) / 10
            : 0,
        );
        tajweedArr.push(
          count > 0
            ? Math.round((sumField("sumTajweed") / count) * 10) / 10
            : 0,
        );
        lessonArr.push(
          count > 0
            ? Math.round((sumField("sumLesson") / count) * 10) / 10
            : 0,
        );
        memQtyArr.push(sumField("totalMemQty"));
        revQtyArr.push(sumField("totalRevQty"));
      });

      return {
        labels,
        datasets: [
          {
            label: "متوسط السلوك والتعاون",
            data: behaviorArr,
            backgroundColor: "rgba(4, 120, 87, 0.85)",
            type: "bar",
            yAxisID: "y",
          },
          {
            label: "متوسط جودة الحفظ",
            data: memQualityArr,
            backgroundColor: "rgba(6, 95, 70, 0.75)",
            type: "bar",
            yAxisID: "y",
          },
          {
            label: "متوسط جودة المراجعة",
            data: revQualityArr,
            backgroundColor: "rgba(16, 185, 129, 0.75)",
            type: "bar",
            yAxisID: "y",
          },
          {
            label: "متوسط التجويد",
            data: tajweedArr,
            backgroundColor: "rgba(212, 175, 55, 0.75)",
            type: "bar",
            yAxisID: "y",
          },
          {
            label: "متوسط الدرس",
            data: lessonArr,
            backgroundColor: "rgba(245, 158, 11, 0.75)",
            type: "bar",
            yAxisID: "y",
          },
          {
            label: "إجمالي صفحات الحفظ",
            data: memQtyArr,
            type: "line",
            borderColor: "#065f46",
            backgroundColor: "rgba(6, 95, 70, 0.1)",
            borderWidth: 3,
            pointBackgroundColor: "#065f46",
            pointRadius: 5,
            tension: 0.3,
            yAxisID: "y1",
          },
          {
            label: "إجمالي صفحات المراجعة",
            data: revQtyArr,
            type: "line",
            borderColor: "#d4af37",
            backgroundColor: "rgba(212, 175, 55, 0.1)",
            borderWidth: 3,
            pointBackgroundColor: "#d4af37",
            pointRadius: 5,
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      };
    },
    [computeMonthReport],
  );

  // حساب الأكثر تطورًا: مقارنة الشهر الحالي بالشهر السابق
  const computeImprovement = useCallback(
    (allSessions, students, settings, currentMonthStr) => {
      const [cy, cm] = currentMonthStr.split("-").map(Number);

      let py = cy;
      let pm = cm - 1;
      if (pm < 1) {
        pm = 12;
        py = cy - 1;
      }

      const currentReport = computeMonthReport(
        allSessions,
        students,
        settings,
        cy,
        cm,
      );
      const prevReport = computeMonthReport(
        allSessions,
        students,
        settings,
        py,
        pm,
      );

      const currentMap = {};
      currentReport.students.forEach((s) => {
        currentMap[s.studentId] = s.percentage;
      });
      const prevMap = {};
      prevReport.students.forEach((s) => {
        prevMap[s.studentId] = s.percentage;
      });

      const improvements = students
        .filter((s) => s.type === "inperson")
        .map((s) => {
          const curr = currentMap[s._id] || 0;
          const prev = prevMap[s._id] || 0;
          return {
            studentId: s._id,
            studentName: s.name,
            currentPct: curr,
            prevPct: prev,
            diff: Math.round((curr - prev) * 10) / 10,
          };
        });

      improvements.sort((a, b) => b.diff - a.diff);

      return improvements;
    },
    [computeMonthReport],
  );

  const fetchAndCompute = useCallback(async () => {
    if (!circleId) return;
    setLoading(true);
    try {
      const [studentsRes, sessionsRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE}/students?circleId=${circleId}`),
        axios.get(`${API_BASE}/sessions?circleId=${circleId}`),
        axios.get(`${API_BASE}/settings`),
      ]);

      // ⭐ استبعاد الطلاب الموقوفين من كل الحسابات
      const students = studentsRes.data.filter((s) => s.status !== "paused");
      const sessions = sessionsRes.data;
      const settings = settingsRes.data;

      const monthsSet = new Set();
      sessions.forEach((s) => {
        if (s.date) monthsSet.add(s.date.substring(0, 7));
      });
      const monthsArray = Array.from(monthsSet).sort((a, b) =>
        b.localeCompare(a),
      );

      setMonths(monthsArray);

      const targetMonth =
        selectedMonth && monthsArray.includes(selectedMonth)
          ? selectedMonth
          : monthsArray[0];

      if (!selectedMonth && monthsArray.length > 0) {
        setSelectedMonth(monthsArray[0]);
      }

      if (targetMonth) {
        const [year, month] = targetMonth.split("-").map(Number);
        const report = computeMonthReport(
          sessions,
          students,
          settings,
          year,
          month,
        );
        setReportData(report);

        const improvement = computeImprovement(
          sessions,
          students,
          settings,
          targetMonth,
        );
        setImprovementData(improvement);
      } else {
        setReportData(null);
        setImprovementData(null);
      }

      if (monthsArray.length > 0) {
        const chart = computeChartData(sessions, students, settings);
        setChartData(chart);
      } else {
        setChartData(null);
      }
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    circleId,
    selectedMonth,
    computeMonthReport,
    computeChartData,
    computeImprovement,
  ]);

  useEffect(() => {
    fetchAndCompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId, selectedMonth]);

  const exportPDF = () => {
    const element = document.getElementById("gamification-pdf");
    if (!element) return;
    html2pdf()
      .set({
        margin: 8,
        filename: "المنافسة-والأبطال.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const getMonthLabel = (monthStr) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { family: "Tajawal", size: 11 },
          color: "#374151",
          boxWidth: 12,
        },
        rtl: true,
      },
      tooltip: {
        rtl: true,
        bodyFont: { family: "Tajawal" },
        titleFont: { family: "Tajawal" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "Tajawal", size: 10 },
          color: "#6b7280",
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        position: "left",
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { family: "Tajawal", size: 10 }, color: "#6b7280" },
      },
      y1: {
        position: "right",
        grid: { display: false },
        ticks: { font: { family: "Tajawal", size: 10 }, color: "#d4af37" },
      },
    },
  };

  const inpersonStudents = reportData
    ? reportData.students.filter((s) => s.studentType === "inperson")
    : [];

  const topMostMem = [...inpersonStudents].sort(
    (a, b) => b.totalMemQty - a.totalMemQty,
  )[0];
  const topMostRev = [...inpersonStudents].sort(
    (a, b) => b.totalRevQty - a.totalRevQty,
  )[0];

  const topImproved =
    improvementData && improvementData.length > 0
      ? improvementData
          .filter((s) => s.diff > 0)
          .sort((a, b) => b.diff - a.diff)[0]
      : null;

  const topProgress = [...inpersonStudents].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];

  // ⭐ الأكثر سلوكًا وتعاونًا
  const topBehavior = [...inpersonStudents].sort(
    (a, b) => b.sumBehavior - a.sumBehavior,
  )[0];

  const avgPercentage =
    inpersonStudents.length > 0
      ? Math.round(
          (inpersonStudents.reduce((sum, s) => sum + s.percentage, 0) /
            inpersonStudents.length) *
            10,
        ) / 10
      : 0;

  // هل الشهر المحدد يستخدم النظام الجديد؟
  const monthUsesNewSystem =
    selectedMonth && isNewSystem(selectedMonth + "-01");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            المنافسة والأبطال
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            تصنيف شامل دقيق للطلاب الحضوريين مع الجوائز والتفاصيل الكاملة
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="btn-outline flex items-center gap-2 text-sm">
          📄 PDF
        </button>
      </div>

      <div className="glass p-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          اختر الشهر
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-72 px-4 py-3 rounded-xl border border-gray-200 bg-white/70 font-semibold text-emerald-800">
          <option value="">اختر شهراً</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {getMonthLabel(month)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">جارٍ التحميل...</p>
        </div>
      ) : reportData && reportData.sessionCount > 0 ? (
        <div id="gamification-pdf" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <div className="text-2xl md:text-3xl mb-1">📚</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-800">
                {reportData.sessionCount}
              </div>
              <div className="text-xs text-gray-500">عدد الحصص</div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <div className="text-2xl md:text-3xl mb-1">🏅</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-800">
                {inpersonStudents.length}
              </div>
              <div className="text-xs text-gray-500">طلاب حضوري</div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <div className="text-2xl md:text-3xl mb-1">💯</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-800">
                {reportData.monthMaxTotal}
              </div>
              <div className="text-xs text-gray-500">الحد الأقصى</div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <div className="text-2xl md:text-3xl mb-1">📊</div>
              <div className="text-xl md:text-2xl font-bold text-emerald-800">
                {avgPercentage}%
              </div>
              <div className="text-xs text-gray-500">متوسط النسبة</div>
            </div>
          </div>

          {/* شارة النظام المطبق */}
          <div
            className={`p-3 rounded-xl text-xs text-center ${
              monthUsesNewSystem
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
            {monthUsesNewSystem
              ? "✨ هذا الشهر يطبق النظام الجديد: «السلوك والتعاون» بدجتين، والحضور بدون درجات."
              : "🕓 هذا الشهر يطبق النظام القديم: الحضور يمنح درجتين للحاضر والمعتذر."}
          </div>

          {inpersonStudents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {inpersonStudents
                .filter((s) => s.rank)
                .slice(0, 3)
                .map((student, idx) => (
                  <div
                    key={student.studentId}
                    className={`glass p-5 md:p-6 text-center relative overflow-hidden hover:shadow-2xl transition-all ${
                      idx === 0
                        ? "border-3 border-amber-400 shadow-2xl md:order-2 md:scale-105"
                        : idx === 1
                          ? "border-3 border-gray-300 md:order-1"
                          : "border-3 border-orange-400 md:order-3"
                    }`}>
                    {idx === 0 && (
                      <div className="absolute top-3 left-3 bg-amber-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                        البطل
                      </div>
                    )}
                    <span className="text-5xl md:text-6xl block mb-2">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <div className="text-lg md:text-2xl font-amiri font-bold text-emerald-800">
                      {student.studentName}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold gold-gradient my-2">
                      {student.totalScore}
                    </div>
                    <div className="text-sm md:text-base font-semibold text-gray-600">
                      {student.percentage}%
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs md:text-sm">
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <span className="block text-[10px] md:text-xs text-gray-500">
                          الحفظ
                        </span>
                        <span className="font-bold text-emerald-700">
                          {student.totalMemQty}
                        </span>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2">
                        <span className="block text-[10px] md:text-xs text-gray-500">
                          المراجعة
                        </span>
                        <span className="font-bold text-amber-700">
                          {student.totalRevQty}
                        </span>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <span className="block text-[10px] md:text-xs text-gray-500">
                          الحضور
                        </span>
                        <span className="font-bold text-emerald-700">
                          {student.presentCount}/{student.sessionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <span className="text-3xl md:text-4xl block mb-2">📖</span>
              <div className="font-bold text-emerald-800 text-sm md:text-base">
                الأكثر حفظاً
              </div>
              <div className="text-sm md:text-lg font-semibold text-amber-700 mt-1 truncate">
                {topMostMem?.studentName || "-"}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {topMostMem?.totalMemQty || 0} صفحة
              </div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <span className="text-3xl md:text-4xl block mb-2">🔄</span>
              <div className="font-bold text-emerald-800 text-sm md:text-base">
                الأكثر مراجعة
              </div>
              <div className="text-sm md:text-lg font-semibold text-amber-700 mt-1 truncate">
                {topMostRev?.studentName || "-"}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {topMostRev?.totalRevQty || 0} صفحة
              </div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <span className="text-3xl md:text-4xl block mb-2">🌟</span>
              <div className="font-bold text-emerald-800 text-sm md:text-base">
                {monthUsesNewSystem ? "الأكثر سلوكاً" : "الأكثر التزاماً"}
              </div>
              <div className="text-sm md:text-lg font-semibold text-amber-700 mt-1 truncate">
                {monthUsesNewSystem
                  ? topBehavior?.studentName || "-"
                  : topProgress?.studentName || "-"}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {monthUsesNewSystem
                  ? `${topBehavior?.sumBehavior || 0} درجة سلوك`
                  : `${topProgress?.presentCount || 0} حضور`}
              </div>
            </div>
            <div className="glass p-4 text-center hover:shadow-xl transition-all">
              <span className="text-3xl md:text-4xl block mb-2">🚀</span>
              <div className="font-bold text-emerald-800 text-sm md:text-base">
                الأكثر تطوراً
              </div>
              <div className="text-sm md:text-lg font-semibold text-amber-700 mt-1 truncate">
                {topImproved?.studentName || "-"}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {topImproved ? `+${topImproved.diff}%` : "لا يوجد"}
              </div>
            </div>
          </div>

          {/* جدول الترتيب - نسخة الهاتف */}
          <div className="glass p-4 md:hidden">
            <h3 className="font-bold text-base text-emerald-800 mb-3 text-center">
              الترتيب الكامل (حضوري)
            </h3>
            <div className="space-y-2">
              {inpersonStudents
                .filter((s) => s.rank)
                .sort((a, b) => a.rank - b.rank)
                .map((student) => (
                  <div
                    key={student.studentId}
                    className="p-3 rounded-xl bg-white/70 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                            student.rank === 1
                              ? "bg-amber-100 text-amber-700"
                              : student.rank === 2
                                ? "bg-gray-200 text-gray-600"
                                : student.rank === 3
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-500"
                          }`}>
                          {student.rank}
                        </span>
                        <span className="font-semibold text-sm">
                          {student.studentName}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-emerald-700 text-sm">
                          {student.totalScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.percentage}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-emerald-50 rounded p-1.5 text-center">
                        <div className="text-gray-500">حفظ</div>
                        <div className="font-bold text-emerald-700">
                          {student.totalMemQty}
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded p-1.5 text-center">
                        <div className="text-gray-500">مراجعة</div>
                        <div className="font-bold text-amber-700">
                          {student.totalRevQty}
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded p-1.5 text-center">
                        <div className="text-gray-500">حضور</div>
                        <div className="font-bold text-emerald-700">
                          {student.presentCount}/{student.sessionCount}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* جدول الترتيب - نسخة الديسكتوب */}
          <div className="glass p-4 overflow-x-auto hidden md:block">
            <h3 className="font-bold text-lg text-emerald-800 mb-4 text-center">
              الترتيب الكامل للطلاب الحضوريين
            </h3>
            <table
              className="w-full text-sm border-collapse"
              style={{ minWidth: "900px" }}>
              <thead>
                <tr className="border-b-2 border-emerald-200 text-emerald-800">
                  <th className="p-3 text-right">الترتيب</th>
                  <th className="p-3 text-right">الطالب</th>
                  <th className="p-3 text-right">مجموع الدرجات</th>
                  <th className="p-3 text-right">النسبة المئوية</th>
                  <th className="p-3 text-right">صفحات الحفظ</th>
                  <th className="p-3 text-right">صفحات المراجعة</th>
                  <th className="p-3 text-right">مرات الحضور</th>
                </tr>
              </thead>
              <tbody>
                {inpersonStudents
                  .filter((s) => s.rank)
                  .sort((a, b) => a.rank - b.rank)
                  .map((student) => (
                    <tr
                      key={student.studentId}
                      className="border-b border-gray-100 hover:bg-emerald-50/50">
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            student.rank === 1
                              ? "bg-amber-100 text-amber-700"
                              : student.rank === 2
                                ? "bg-gray-200 text-gray-600"
                                : student.rank === 3
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-500"
                          }`}>
                          {student.rank}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">
                        {student.studentName}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        {student.totalScore}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{student.percentage}%</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.percentage >= 60
                                  ? "bg-emerald-500"
                                  : "bg-red-400"
                              }`}
                              style={{
                                width: `${Math.min(student.percentage, 100)}%`,
                              }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{student.totalMemQty}</td>
                      <td className="p-3">{student.totalRevQty}</td>
                      <td className="p-3">
                        {student.presentCount}/{student.sessionCount}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* الرسم البياني */}
          <div className="glass p-4 md:p-6">
            <h3 className="font-bold text-base md:text-lg text-emerald-800 mb-4 text-center">
              📈 تطور مستوى الحلقة عبر الشهور
            </h3>
            <div className="h-72 md:h-96">
              {chartData && chartData.labels && chartData.labels.length > 0 ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <p className="text-gray-400 text-center py-8">
                  لا توجد بيانات كافية للرسم البياني
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg">لا توجد بيانات لهذا الشهر</p>
        </div>
      )}
    </div>
  );
}

export default Gamification;
