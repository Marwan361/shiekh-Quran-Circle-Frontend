import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { API_BASE } from "../config";

function SessionEval({ circleId }) {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [sessionName, setSessionName] = useState("");
  const [evaluations, setEvaluations] = useState({});
  const [showSessionDetails, setShowSessionDetails] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);

  // ⭐ الحقول الجديدة المطابقة للإكسل بالظبط
  const emptyEval = () => ({
    attendance: "",
    textQty: "",
    textGrade: "",
    surahFromStart: "",
    surahFromStartGrade: "",
    recentPastQty: "",
    recentPastGrade: "",
    distantPastQty: "",
    distantPastGrade: "",
    previousSurah: "",
    tajweedGrade: "",
    behaviorGrade: "",
    commitmentGrade: "",
  });

  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const days = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const d = new Date(dateStr + "T00:00:00");
    return days[d.getDay()];
  };

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/students?circleId=${circleId}`);
      setAllStudents(res.data);
      const activeOnly = res.data.filter((s) => s.status !== "paused");
      setStudents(activeOnly);
      const evals = {};
      activeOnly.forEach((student) => {
        evals[student._id] = emptyEval();
      });
      setEvaluations(evals);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, [circleId]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/sessions?circleId=${circleId}`);
      setSessions(res.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }, [circleId]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  useEffect(() => {
    if (circleId) {
      fetchStudents();
      fetchSessions();
      fetchSettings();
    }
  }, [circleId, fetchStudents, fetchSessions, fetchSettings]);

  const handleEvaluationChange = (studentId, field, value) => {
    setEvaluations((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]:
          field === "attendance" ||
          field === "surahFromStart" ||
          field === "previousSurah"
            ? value
            : value === ""
              ? ""
              : parseFloat(value) || 0,
      },
    }));
  };

  // ⭐ حساب المجموع بناءً على الدرجات الجديدة (بدون الكميات لأنها أوزان وليست درجات)
  const calculateTotal = (evaluation) => {
    if (evaluation.attendance !== "present") return 0;
    return (
      (evaluation.textGrade || 0) +
      (evaluation.surahFromStartGrade || 0) +
      (evaluation.recentPastGrade || 0) +
      (evaluation.distantPastGrade || 0) +
      (evaluation.tajweedGrade || 0) +
      (evaluation.behaviorGrade || 0) +
      (evaluation.commitmentGrade || 0)
    );
  };

  const getRatingText = (total) => {
    const maxTotal = 70; // 7 حقول درجات * 10 (أو حسب إعداداتك)
    const pct = (total / maxTotal) * 100;
    if (pct >= 87) return "ممتاز";
    if (pct >= 60) return "جيد";
    return "إعادة";
  };

  const getRatingColor = (total) => {
    const maxTotal = 70;
    const pct = (total / maxTotal) * 100;
    if (pct >= 87) return "#10b981";
    if (pct >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const loadSessionForEdit = (session) => {
    setEditingSessionId(session._id);
    setSessionDate(session.date);
    setSessionName(session.name || "");
    const evals = {};
    students.forEach((student) => {
      const existing = session.evaluations.find(
        (e) => String(e.studentId) === String(student._id),
      );
      evals[student._id] = existing
        ? {
            attendance: existing.attendance || "",
            textQty:
              existing.textQty !== undefined && existing.textQty !== 0
                ? existing.textQty
                : "",
            textGrade:
              existing.textGrade !== undefined && existing.textGrade !== 0
                ? existing.textGrade
                : "",
            surahFromStart: existing.surahFromStart || "",
            surahFromStartGrade:
              existing.surahFromStartGrade !== undefined &&
              existing.surahFromStartGrade !== 0
                ? existing.surahFromStartGrade
                : "",
            recentPastQty:
              existing.recentPastQty !== undefined &&
              existing.recentPastQty !== 0
                ? existing.recentPastQty
                : "",
            recentPastGrade:
              existing.recentPastGrade !== undefined &&
              existing.recentPastGrade !== 0
                ? existing.recentPastGrade
                : "",
            distantPastQty:
              existing.distantPastQty !== undefined &&
              existing.distantPastQty !== 0
                ? existing.distantPastQty
                : "",
            distantPastGrade:
              existing.distantPastGrade !== undefined &&
              existing.distantPastGrade !== 0
                ? existing.distantPastGrade
                : "",
            previousSurah: existing.previousSurah || "",
            tajweedGrade:
              existing.tajweedGrade !== undefined && existing.tajweedGrade !== 0
                ? existing.tajweedGrade
                : "",
            behaviorGrade:
              existing.behaviorGrade !== undefined &&
              existing.behaviorGrade !== 0
                ? existing.behaviorGrade
                : "",
            commitmentGrade:
              existing.commitmentGrade !== undefined &&
              existing.commitmentGrade !== 0
                ? existing.commitmentGrade
                : "",
          }
        : emptyEval();
    });
    setEvaluations(evals);
    document
      .getElementById("session-eval-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const saveSession = async () => {
    if (!sessionDate) {
      alert("يرجى اختيار تاريخ الحصة");
      return;
    }

    const missingAttendance = students.filter(
      (s) => !evaluations[s._id]?.attendance,
    );
    if (missingAttendance.length > 0) {
      const proceed = window.confirm(
        `يوجد ${missingAttendance.length} طالب لم يتم تسجيل حضورهم، سيتم اعتبارهم غائبين. هل تريد المتابعة؟`,
      );
      if (!proceed) return;
    }

    const evaluationsArray = students.map((student) => {
      const evalData = { ...evaluations[student._id] };
      if (!evalData.attendance) evalData.attendance = "absent";

      // تحويل القيم الفارغة إلى 0 للحقول الرقمية
      [
        "textQty",
        "textGrade",
        "surahFromStartGrade",
        "recentPastQty",
        "recentPastGrade",
        "distantPastQty",
        "distantPastGrade",
        "tajweedGrade",
        "behaviorGrade",
        "commitmentGrade",
      ].forEach((field) => {
        if (evalData[field] === "") evalData[field] = 0;
      });

      // تصفير الدرجات للغائب أو المعتذر
      if (
        evalData.attendance === "excused" ||
        evalData.attendance === "absent"
      ) {
        evalData.textQty = 0;
        evalData.textGrade = 0;
        evalData.surahFromStart = "";
        evalData.surahFromStartGrade = 0;
        evalData.recentPastQty = 0;
        evalData.recentPastGrade = 0;
        evalData.distantPastQty = 0;
        evalData.distantPastGrade = 0;
        evalData.previousSurah = "";
        evalData.tajweedGrade = 0;
        evalData.behaviorGrade = 0;
        evalData.commitmentGrade = 0;
      }

      return {
        studentId: student._id,
        ...evalData,
        total: calculateTotal(evalData),
      };
    });

    try {
      await axios.post(`${API_BASE}/sessions`, {
        circleId,
        date: sessionDate,
        name: sessionName,
        evaluations: evaluationsArray,
      });
      alert("تم حفظ الحصة بنجاح!");
      setEditingSessionId(null);
      fetchSessions();
      setSessionName("");
      const evals = {};
      students.forEach((student) => {
        evals[student._id] = emptyEval();
      });
      setEvaluations(evals);
      setSessionDate(new Date().toISOString().split("T")[0]);
    } catch (error) {
      console.error("Error saving session:", error);
      alert("فشل حفظ الحصة");
    }
  };

  const exportPDF = () => {
    const element = document.getElementById("session-pdf");
    html2pdf()
      .set({
        margin: 10,
        filename: "تقييم-الحصة.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;
    try {
      await axios.delete(`${API_BASE}/sessions/${sessionId}`);
      fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const getCardStyle = (attendance) => {
    if (attendance === "present") return "bg-emerald-50/60 border-emerald-200";
    if (attendance === "excused") return "bg-amber-50/60 border-amber-200";
    if (attendance === "absent") return "bg-red-50/40 border-red-200";
    return "bg-white/60 border-gray-100";
  };

  const attendanceLabel = (att) => {
    if (att === "present") return "حاضر";
    if (att === "excused") return "معتذر";
    if (att === "absent") return "غائب";
    return "غير مسجل";
  };

  const attendanceBadgeColor = (att) => {
    if (att === "present") return "bg-emerald-500";
    if (att === "excused") return "bg-amber-500";
    if (att === "absent") return "bg-red-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-amiri text-3xl md:text-4xl font-bold gold-gradient">
            تقييم الحصة اليومية
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            سجل تقييم حصة جديدة بناءً على التاريخ واسم الحصة
          </p>
        </div>
        <button
          onClick={exportPDF}
          className="btn-outline flex items-center gap-2 text-sm">
          📄 PDF
        </button>
      </div>

      {sessions.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-bold text-emerald-800 mb-3">الحصص المسجلة</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/60 border border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-700">
                    {session.name || session.date}
                  </span>
                  <span className="text-sm text-gray-400">
                    {session.date} - {getDayName(session.date)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadSessionForEdit(session)}
                    className="text-xs text-emerald-600 hover:text-emerald-800">
                    تعديل
                  </button>
                  <button
                    onClick={() => setShowSessionDetails(session)}
                    className="text-xs text-gray-600 hover:text-gray-800">
                    عرض
                  </button>
                  <button
                    onClick={() => deleteSession(session._id)}
                    className="text-xs text-red-500 hover:text-red-700">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass p-6" id="session-eval-form">
        <h3 className="font-bold text-lg text-emerald-800 mb-4">
          {editingSessionId ? "تعديل الحصة" : "تسجيل حصة جديدة"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              تاريخ الحصة
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
              />
              {sessionDate && (
                <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold whitespace-nowrap">
                  {getDayName(sessionDate)}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              اسم الحصة
            </label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="مثال: حصة الفجر، حصة العصر"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              الطلاب النشطون
            </label>
            <div className="px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-600">
              {students.length} طالب
            </div>
          </div>
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            لا يوجد طلاب نشطون. أضف طلاباً أولاً من شاشة الطلاب.
          </p>
        ) : (
          <div className="space-y-4">
            {students.map((student) => {
              const evalData = evaluations[student._id] || emptyEval();
              const hasAttendance = !!evalData.attendance;
              const total = hasAttendance ? calculateTotal(evalData) : 0;
              const rating = hasAttendance ? getRatingText(total) : "";
              const ratingColor = getRatingColor(total);

              return (
                <div
                  key={student._id}
                  className={`p-4 rounded-xl border transition-all ${getCardStyle(evalData.attendance)}`}>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800">
                        {student.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${student.type === "inperson" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {student.type === "inperson" ? "حضوري" : "أونلاين"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-700">
                        {hasAttendance ? total : "-"}
                      </span>
                      {hasAttendance && (
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: ratingColor, color: "white" }}>
                          {rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ⭐ الحقول المطابقة للإكسل */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                    <div>
                      <label className="text-xs text-gray-500">الحضور</label>
                      <select
                        value={evalData.attendance || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "attendance",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm">
                        <option value="">-- اختر --</option>
                        <option value="present">حاضر</option>
                        <option value="excused">معتذر</option>
                        <option value="absent">غائب</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">كمية النص</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.textQty || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "textQty",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">درجة النص</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.textGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "textGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        السورة من أولها
                      </label>
                      <input
                        type="text"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.surahFromStart || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "surahFromStart",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">الدرجة</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.surahFromStartGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "surahFromStartGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        كمية الماضي القريب
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.recentPastQty || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "recentPastQty",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">الدرجة</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.recentPastGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "recentPastGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        كمية الماضي البعيد
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.distantPastQty || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "distantPastQty",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">الدرجة</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.distantPastGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "distantPastGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        السورة السابقة
                      </label>
                      <input
                        type="text"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.previousSurah || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "previousSurah",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        درجة التجويد
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.tajweedGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "tajweedGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        درجة السلوك
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.behaviorGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "behaviorGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">
                        درجة الالتزام
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={evalData.attendance !== "present"}
                        value={evalData.commitmentGrade || ""}
                        onChange={(e) =>
                          handleEvaluationChange(
                            student._id,
                            "commitmentGrade",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-3 pt-4">
              <button onClick={saveSession} className="btn-emerald flex-1">
                {editingSessionId ? "تحديث الحصة" : "حفظ الحصة"}
              </button>
              {editingSessionId && (
                <button
                  onClick={() => {
                    setEditingSessionId(null);
                    setSessionName("");
                    setSessionDate(new Date().toISOString().split("T")[0]);
                    const evals = {};
                    students.forEach((student) => {
                      evals[student._id] = emptyEval();
                    });
                    setEvaluations(evals);
                  }}
                  className="btn-outline">
                  إلغاء التعديل
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {showSessionDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2"
          onClick={(e) =>
            e.target === e.currentTarget && setShowSessionDetails(null)
          }>
          <div
            className="glass p-4 md:p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto"
            id="session-details-pdf">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="font-amiri text-xl md:text-2xl font-bold text-emerald-800">
                  تفاصيل الحصة
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {showSessionDetails.name || ""} — {showSessionDetails.date} (
                  {getDayName(showSessionDetails.date)})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    html2pdf()
                      .set({
                        margin: 10,
                        filename: `حصة-${showSessionDetails.date}.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: {
                          unit: "mm",
                          format: "a4",
                          orientation: "portrait",
                        },
                      })
                      .from(document.getElementById("session-details-pdf"))
                      .save();
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  📄 PDF
                </button>
                <button
                  onClick={() => setShowSessionDetails(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                  إغلاق
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {showSessionDetails.evaluations.map((evaluation) => {
                const student = allStudents.find(
                  (s) => String(s._id) === String(evaluation.studentId),
                );
                if (!student) return null;
                const isPaused = student.status === "paused";
                const total = calculateTotal(evaluation);
                const rating = getRatingText(total);
                const ratingColor = getRatingColor(total);
                const att = evaluation.attendance;

                return (
                  <div
                    key={evaluation.studentId}
                    className={`p-3 md:p-4 rounded-xl border ${getCardStyle(att)} ${isPaused ? "opacity-70" : ""}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-emerald-800">
                          {student.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${student.type === "inperson" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {student.type === "inperson" ? "حضوري" : "أونلاين"}
                        </span>
                        {isPaused && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            ⏸ موقوف
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full text-white ${attendanceBadgeColor(att)}`}>
                          {attendanceLabel(att)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-emerald-700">
                          {total}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ background: ratingColor, color: "white" }}>
                          {rating}
                        </span>
                      </div>
                    </div>

                    {att === "present" ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 text-xs">
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">كمية النص</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.textQty || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">درجة النص</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.textGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">
                            السورة من أولها
                          </div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.surahFromStart || "-"}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">الدرجة</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.surahFromStartGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">
                            كمية الماضي القريب
                          </div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.recentPastQty || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">الدرجة</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.recentPastGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">
                            كمية الماضي البعيد
                          </div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.distantPastQty || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">الدرجة</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.distantPastGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">
                            السورة السابقة
                          </div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.previousSurah || "-"}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">التجويد</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.tajweedGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">السلوك</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.behaviorGrade || 0}
                          </div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2 text-center border border-gray-100">
                          <div className="text-gray-500 mb-1">الالتزام</div>
                          <div className="font-bold text-emerald-700">
                            {evaluation.commitmentGrade || 0}
                          </div>
                        </div>
                      </div>
                    ) : att === "excused" ? (
                      <div className="text-xs rounded-lg p-2 text-center text-gray-600 bg-white/60">
                        معتذر — لا يوجد درجات
                      </div>
                    ) : (
                      <div className="text-xs text-red-700 bg-white/60 rounded-lg p-2 text-center">
                        {att === "absent"
                          ? "غائب — لا يوجد درجات"
                          : "لم يتم تسجيل الحضور"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionEval;
