import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Students from "./components/Students";
import SessionEval from "./components/SessionEval";
import MonthlyReport from "./components/MonthlyReport";
import Gamification from "./components/Gamification";
import Settings from "./components/Settings";
import { API_BASE } from "./config";

function App() {
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [circles, setCircles] = useState([]);
  const [currentCircleId, setCurrentCircleId] = useState(null);

  const fetchCircles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/circles`);

      // ⭐ حماية: التأكد إن الرد مصفوفة
      if (Array.isArray(res.data)) {
        setCircles(res.data);
        if (res.data.length > 0 && !currentCircleId) {
          setCurrentCircleId(res.data[0]._id);
        }
      } else {
        console.error("⚠️ الـ API رجع رد غير متوقع:", res.data);
        setCircles([]); // نرجع مصفوفة فاضية عشان ميحصلش كراش
      }
    } catch (err) {
      console.error("فشل تحميل الحلقات:", err?.response?.data || err.message);
      setCircles([]); // مهم جداً: نرجع مصفوفة فاضية حتى لو حصل خطأ
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const navigateTo = (screen) => setCurrentScreen(screen);
  const handleCircleChange = (circleId) => setCurrentCircleId(circleId);

  const handleCreateCircle = async (name) => {
    try {
      await axios.post(`${API_BASE}/circles`, { name });
      await fetchCircles();
    } catch (error) {
      console.error("فشل إنشاء الحلقة:", error);
      alert("فشل إنشاء الحلقة");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        <Sidebar
          currentScreen={currentScreen}
          navigateTo={navigateTo}
          circles={circles}
          currentCircleId={currentCircleId}
          onCircleChange={handleCircleChange}
          onCreateCircle={handleCreateCircle}
        />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {currentScreen === "dashboard" && (
            <Dashboard circleId={currentCircleId} />
          )}
          {currentScreen === "students" && (
            <Students
              circleId={currentCircleId}
              circles={circles}
              onStudentsChange={fetchCircles}
            />
          )}
          {currentScreen === "session" && (
            <SessionEval circleId={currentCircleId} />
          )}
          {currentScreen === "report" && (
            <MonthlyReport circleId={currentCircleId} />
          )}
          {currentScreen === "gamification" && (
            <Gamification circleId={currentCircleId} />
          )}
          {currentScreen === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default App;
