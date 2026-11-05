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

function MonthlyReport({ circleId }) {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMonths = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions?circleId=${circleId}`);
      const sessions = res.data;
      const monthsSet = new Set();
      sessions.forEach((session) => {
        const [year, month] = session.date.split("-");
        monthsSet.add(`${year}-${month}`);
      });
      const monthsArray = Array.from(monthsSet).sort((a, b) =>
        b.localeCompare(a),
      );
      setMonths(monthsArray);
      if (monthsArray.length > 0) {
        setSelectedMonth(monthsArray[0]);
      }
    } catch (error) {
      console.error("Error fetching months:", error);
    }
  }, [circleId]);

  const fetchReport = useCallback(async () => {
    if (!selectedMonth) return;
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");

      // نجلب التقرير + قائمة الطلاب (لمعرفة من هو موقوف)
      const [reportRes, studentsRes] = await Promise.all([
        axios.get(
          `${API_BASE}/reports/monthly?circleId=${circleId}&year=${year}&month=${parseInt(month)}`,
        ),
        axios.get(`${API_BASE}/students?circleId=${circleId}`),
      ]);

      // خريطة: studentId → status
      const statusMap = {};
      studentsRes.data.forEach((s) => {
        statusMap[s._id] = s.status || "active";
      });

      // فلترة الطلاب الموقوفين من التقرير
      const filteredStudents = reportRes.data.students.filter(
        (s) => statusMap[s.studentId] !== "paused",
      );

      setReportData({
        ...reportRes.data,
        students: filteredStudents,
      });
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, circleId]);

  useEffect(() => {
    if (circleId) fetchMonths();
  }, [circleId, fetchMonths]);

  useEffect(() => {
    if (selectedMonth && circleId) fetchReport();
  }, [selectedMonth, circleId, fetchReport]);

  const exportPDF = () => {
    const element = document.getElementById("report-pdf");
    html2pdf()
      .set({
        margin: 10,
        filename: "التقرير-الشهري.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(element)
      .save();
  };

  const getMonthLabel = (monthStr) => {
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

  // بيانات الرسم البياني لتوزيع النسب المئوية
  const chartData = reportData
    ? {
        labels: reportData.students.map((s) => s.studentName),
        datasets: [
          {
            label: "النسبة المئوية %",
            data: reportData.students.map((s) => s.percentage),
            backgroundColor: reportData.students.map((s) =>
              s.percentage >= 80
                ? "rgba(6, 95, 70, 0.8)"
                : s.percentage >= 60
                  ? "rgba(16, 185, 129, 0.8)"
                  : "rgba(245, 158, 11, 0.8)",
            ),
            borderColor: "rgba(6, 95, 70, 1)",
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { font: { family: "Tajawal", size: 12 }, color: "#374151" },
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
        ticks: { font: { family: "Tajawal", size: 10 }, color: "#6b7280" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { family: "Tajawal", size: 10 },
          color: "#6b7280",
          callback: function (v) {
            return v + "%";
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            التقرير الشهري التلقائي
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            اختر الشهر لعرض التقرير الكامل بجدول ورسم بياني واضح
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
          <p className="text-gray-400">جارٍ تحميل التقرير...</p>
        </div>
      ) : reportData ? (
        <div id="report-pdf" className="space-y-6">
          <div className="glass p-4 overflow-x-auto">
            <h3 className="font-bold text-lg text-emerald-800 mb-4 text-center">
              التقرير الشهري - {getMonthLabel(selectedMonth)}
            </h3>
            <div className="text-sm text-gray-500 mb-4 text-center">
              عدد الحصص: {reportData.sessionCount} | الحد الأقصى للدرجات:{" "}
              {reportData.monthMaxTotal}
            </div>
            <table
              className="w-full text-sm border-collapse"
              style={{ minWidth: "800px" }}>
              <thead>
                <tr className="border-b-2 border-emerald-200 text-emerald-800">
                  <th className="p-2 text-right">الترتيب</th>
                  <th className="p-2 text-right">الطالب</th>
                  <th className="p-2 text-right">النوع</th>
                  <th className="p-2 text-right">مجموع الدرجات</th>
                  <th className="p-2 text-right">النسبة</th>
                  <th className="p-2 text-right">صفحات الحفظ</th>
                  <th className="p-2 text-right">صفحات المراجعة</th>
                  <th className="p-2 text-right">مرات الحضور</th>
                </tr>
              </thead>
              <tbody>
                {reportData.students.map((student) => (
                  <tr
                    key={student.studentId}
                    className="border-b border-gray-100 hover:bg-emerald-50/50">
                    <td className="p-2">
                      {student.rank ? (
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
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-2 font-semibold">{student.studentName}</td>
                    <td className="p-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          student.studentType === "inperson"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {student.studentType === "inperson" ? "حضوري" : "أونلاين"}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-emerald-700">
                      {student.totalScore}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span>{student.percentage}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
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
                    <td className="p-2">{student.totalMemQty}</td>
                    <td className="p-2">{student.totalRevQty}</td>
                    <td className="p-2">
                      {student.presentCount}/{reportData.sessionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الرسم البياني لتوزيع النسب */}
          {chartData && (
            <div className="glass p-6">
              <h3 className="font-bold text-lg text-emerald-800 mb-4 text-center">
                📊 توزيع النسب المئوية للطلاب
              </h3>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400 text-lg">لا توجد بيانات لهذا الشهر</p>
        </div>
      )}
    </div>
  );
}

export default MonthlyReport;
