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

function Students({ circleId, circles, onStudentsChange }) {
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [studentMonthlyData, setStudentMonthlyData] = useState([]);
  const [formData, setFormData] = useState({ name: "", type: "inperson" });
  const [moveTargetCircle, setMoveTargetCircle] = useState("");

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/students?circleId=${circleId}`);
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, [circleId]);

  useEffect(() => {
    if (circleId) fetchStudents();
  }, [circleId, fetchStudents]);

  const handleAddStudent = async () => {
    try {
      await axios.post(`${API_BASE}/students`, {
        ...formData,
        circleId,
      });
      setShowAddModal(false);
      setFormData({ name: "", type: "inperson" });
      fetchStudents();
      if (onStudentsChange) onStudentsChange();
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleEditStudent = async () => {
    try {
      await axios.put(`${API_BASE}/students/${selectedStudent._id}`, formData);
      setShowEditModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
      try {
        await axios.delete(`${API_BASE}/students/${studentId}`);
        fetchStudents();
        if (onStudentsChange) onStudentsChange();
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  // ====== إيقاف/تنشيط الطالب ======
  const toggleStudentStatus = async (student) => {
    const isPaused = student.status === "paused";
    const newStatus = isPaused ? "active" : "paused";
    const confirmMsg = isPaused
      ? `سيتم تنشيط "${student.name}" وإعادته للحسابات والترتيب. متابعة؟`
      : `سيتم إيقاف "${student.name}" — لن يُحسب في النسب ولا في تسجيل الحصص حتى يتم تنشيطه. متابعة؟`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await axios.put(`${API_BASE}/students/${student._id}`, {
        status: newStatus,
      });
      fetchStudents();
    } catch (error) {
      console.error("Error toggling student status:", error);
      alert("فشل تغيير حالة الطالب");
    }
  };

  const handleMoveStudent = async () => {
    if (!moveTargetCircle) {
      alert("اختر الحلقة الهدف");
      return;
    }
    if (moveTargetCircle === circleId) {
      alert("الطالب موجود في هذه الحلقة بالفعل");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/students/${selectedStudent._id}/move`,
        { circleId: moveTargetCircle },
      );
      const moved = res.data.movedSessions || 0;
      const unmatched = res.data.unmatchedDates?.length || 0;
      alert(
        `تم نقل الطالب بنجاح ✅\n` +
          `عدد الحصص المنقولة: ${moved}` +
          (unmatched > 0
            ? `\n(تم تجاهل ${unmatched} حصة لا يوجد لها مثيل في الحلقة الجديدة)`
            : ""),
      );
      setShowMoveModal(false);
      setMoveTargetCircle("");
      fetchStudents();
      if (onStudentsChange) onStudentsChange();
    } catch (error) {
      console.error("Error moving student:", error);
      const msg = error?.response?.data?.error || "فشل نقل الطالب";
      alert(msg);
    }
  };

  const handleViewReport = async (student) => {
    try {
      const res = await axios.get(
        `${API_BASE}/reports/student/${student._id}?circleId=${circleId}`,
      );
      setStudentReport(res.data);
      setSelectedStudent(student);
      setShowReportModal(true);

      const sessionsRes = await axios.get(
        `${API_BASE}/sessions?circleId=${circleId}`,
      );
      const sessions = sessionsRes.data;
      const maxTotal = 70; // الحد الأقصى للنظام الجديد (7 حقول درجات * 10)

      const monthlyMap = new Map();
      sessions.forEach((session) => {
        const date = new Date(session.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const ev = session.evaluations.find(
          (e) => String(e.studentId) === String(student._id),
        );
        if (ev) {
          if (!monthlyMap.has(key)) {
            monthlyMap.set(key, {
              label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
              total: 0,
              sessions: 0,
              present: 0,
            });
          }
          const data = monthlyMap.get(key);
          if (ev.attendance === "present") {
            // نجمع الدرجات فقط (بدون كميات)
            data.total += ev.total || 0;
            data.present++;
          }
          data.sessions++;
        }
      });

      const monthlyArray = Array.from(monthlyMap.entries()).map(
        ([key, value]) => ({
          ...value,
          percentage:
            value.sessions > 0
              ? (value.total / (value.sessions * maxTotal)) * 100
              : 0,
        }),
      );
      monthlyArray.sort((a, b) => a.label.localeCompare(b.label));
      setStudentMonthlyData(monthlyArray);
    } catch (error) {
      console.error("Error fetching student report:", error);
    }
  };

  const exportPDF = () => {
    const element = document.getElementById("students-pdf");
    html2pdf()
      .set({
        margin: 10,
        filename: "قائمة-الطلاب.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

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
        position: "left",
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

  // ترتيب القائمة: النشطون أولًا، ثم الموقوفون
  const sortedStudents = [...students].sort((a, b) => {
    const aPaused = a.status === "paused" ? 1 : 0;
    const bPaused = b.status === "paused" ? 1 : 0;
    return aPaused - bPaused;
  });

  const activeCount = students.filter((s) => s.status !== "paused").length;
  const pausedCount = students.filter((s) => s.status === "paused").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            إدارة الطلاب
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            أضف وعدّل ونقل الطلاب، مع إمكانية إيقاف المنقطع عن الحلقة
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="btn-outline flex items-center gap-2 text-sm">
            📄 PDF
          </button>
          <button
            onClick={() => {
              if (!circleId) {
                alert("الرجاء إنشاء حلقة أولاً من خلال القائمة الجانبية");
                return;
              }
              setShowAddModal(true);
            }}
            className="btn-emerald flex items-center gap-2 text-sm">
            ➕ إضافة طالب
          </button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm text-gray-600">نشط:</span>
            <span className="font-bold text-emerald-700">{activeCount}</span>
          </div>
          {pausedCount > 0 && (
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-sm text-gray-600">موقوف:</span>
              <span className="font-bold text-red-700">{pausedCount}</span>
            </div>
          )}
        </div>
      )}

      <div id="students-pdf" className="space-y-4">
        {students.length === 0 ? (
          <div className="glass p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <p className="text-gray-400 text-lg">لا يوجد طلاب مسجلون بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStudents.map((student) => {
              const isPaused = student.status === "paused";
              return (
                <div
                  key={student._id}
                  className={`glass p-5 hover:shadow-2xl transition-all relative ${
                    isPaused ? "opacity-60 border border-red-100" : ""
                  }`}>
                  {isPaused && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      ⏸ موقوف
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        isPaused
                          ? "bg-gray-200 text-gray-500"
                          : student.type === "inperson"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h3
                        className={`font-bold text-lg ${
                          isPaused ? "text-gray-500" : "text-emerald-800"
                        }`}>
                        {student.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          student.type === "inperson"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {student.type === "inperson" ? "حضوري" : "أونلاين"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setFormData({
                          name: student.name,
                          type: student.type,
                        });
                        setShowEditModal(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                      تعديل
                    </button>
                    <button
                      onClick={() => handleViewReport(student)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                      تقرير
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setMoveTargetCircle("");
                        setShowMoveModal(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200">
                      نقل
                    </button>
                    <button
                      onClick={() => toggleStudentStatus(student)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        isPaused
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      }`}>
                      {isPaused ? "▶ تنشيط" : "⏸ إيقاف"}
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddModal(false)
          }>
          <div className="glass p-6 w-full max-w-md">
            <h2 className="font-amiri text-2xl font-bold text-emerald-800 mb-4">
              إضافة طالب جديد
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:border-emerald-600"
                  placeholder="أدخل اسم الطالب"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  نوع الطالب
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70">
                  <option value="inperson">حضوري</option>
                  <option value="online">أونلاين</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddStudent}
                  className="btn-emerald flex-1">
                  إضافة
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowEditModal(false)
          }>
          <div className="glass p-6 w-full max-w-md">
            <h2 className="font-amiri text-2xl font-bold text-emerald-800 mb-4">
              تعديل بيانات الطالب
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  نوع الطالب
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70">
                  <option value="inperson">حضوري</option>
                  <option value="online">أونلاين</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditStudent}
                  className="btn-emerald flex-1">
                  حفظ
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-outline">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Student Modal */}
      {showMoveModal && selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowMoveModal(false)
          }>
          <div className="glass p-6 w-full max-w-md">
            <h2 className="font-amiri text-2xl font-bold text-emerald-800 mb-4">
              نقل الطالب إلى حلقة أخرى
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              الطالب: <span className="font-bold">{selectedStudent.name}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  الحلقة الهدف
                </label>
                <select
                  value={moveTargetCircle}
                  onChange={(e) => setMoveTargetCircle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70">
                  <option value="">-- اختر الحلقة --</option>
                  {circles
                    .filter((c) => c._id !== circleId)
                    .map((circle) => (
                      <option key={circle._id} value={circle._id}>
                        {circle.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-700">
                ⓘ سيتم نقل الطالب مع تقييماته إلى الحصص المطابقة بالتاريخ في
                الحلقة الجديدة.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleMoveStudent}
                  className="btn-emerald flex-1"
                  disabled={!moveTargetCircle}>
                  تأكيد النقل
                </button>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="btn-outline">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Report Modal */}
      {showReportModal && studentReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2"
          onClick={(e) =>
            e.target === e.currentTarget && setShowReportModal(false)
          }>
          <div
            className="glass p-4 md:p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto"
            id="student-report-pdf">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="font-amiri text-xl md:text-2xl font-bold text-emerald-800">
                تقرير: {studentReport.student.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    html2pdf()
                      .set({
                        margin: 10,
                        filename: `تقرير-${studentReport.student.name}.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: {
                          unit: "mm",
                          format: "a4",
                          orientation: "portrait",
                        },
                      })
                      .from(document.getElementById("student-report-pdf"))
                      .save();
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  📄 PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                  إغلاق
                </button>
              </div>
            </div>

            {/* ⭐ تم شيل كروت الكميات من هنا */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-emerald-50 text-center">
                <div className="text-2xl font-bold text-emerald-800">
                  {studentReport.totalScore}
                </div>
                <div className="text-xs text-gray-500">مجموع الدرجات</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {studentReport.percentage}%
                </div>
                <div className="text-xs text-gray-500">النسبة المئوية</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 text-center">
                <div className="text-2xl font-bold text-emerald-800">
                  {studentReport.presentCount}/{studentReport.sessionCount}
                </div>
                <div className="text-xs text-gray-500">الحضور</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {studentReport.rank
                    ? `الترتيب ${studentReport.rank} من ${studentReport.totalInPerson}`
                    : "غير مصنف"}
                </div>
                <div className="text-xs text-gray-500">الترتيب</div>
              </div>
            </div>

            {studentMonthlyData.length > 0 && (
              <div className="glass p-4 mb-4">
                <h3 className="font-bold text-base md:text-lg text-emerald-800 mb-3 text-center">
                  📈 تطور الطالب عبر الشهور
                </h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: studentMonthlyData.map((d) => d.label),
                      datasets: [
                        {
                          label: "النسبة المئوية %",
                          data: studentMonthlyData.map(
                            (d) => Math.round(d.percentage * 10) / 10,
                          ),
                          backgroundColor: "rgba(6, 95, 70, 0.7)",
                          yAxisID: "y",
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setShowReportModal(false)}
              className="btn-outline w-full mt-4">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
