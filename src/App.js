import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Students from "./components/Students";
import SessionEval from "./components/SessionEval";
import MonthlyReport from "./components/MonthlyReport";
import Gamification from "./components/Gamification";
import Settings from "./components/Settings";
import Login from "./components/Login";
import { API_BASE } from "./config";

function App() {
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [circles, setCircles] = useState([]);
  
  // ⭐ حالة المصادقة (بنقراها من الذاكرة عشان ميسألش كل مرة)
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("quran_auth");
    return saved ? JSON.parse(saved) : null;
  });
  
  const currentCircleId = auth?.role === "admin" ? (auth?.activeCircleId || null) : auth?.circleId;

  const fetchCircles = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/circles`);
      if (Array.isArray(res.data)) {
        setCircles(res.data);
        // لو مدير ومفيش حلقة مختارة، نختار أول واحدة
        if (auth?.role === "admin" && res.data.length > 0 && !auth.activeCircleId) {
          const updatedAuth = { ...auth, activeCircleId: res.data[0]._id };
          setAuth(updatedAuth);
          localStorage.setItem("quran_auth", JSON.stringify(updatedAuth));
        }
      }
    } catch (err) {
      console.error("فشل تحميل الحلقات:", err);
    }
  }, [auth]);

  useEffect(() => {
    if (auth) fetchCircles();
  }, [auth, fetchCircles]);

  const handleLogin = (data) => {
    setAuth(data);
    localStorage.setItem("quran_auth", JSON.stringify(data));
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem("quran_auth");
    setCurrentScreen("dashboard");
  };

  const handleCircleChange = (circleId) => {
    const updatedAuth = { ...auth, activeCircleId: circleId };
    setAuth(updatedAuth);
    localStorage.setItem("quran_auth", JSON.stringify(updatedAuth));
  };

  const handleCreateCircle = async (name) => {
    try {
      await axios.post(`${API_BASE}/circles`, { name });
      await fetchCircles();
    } catch (error) {
      console.error("فشل إنشاء الحلقة:", error);
      alert("فشل إنشاء الحلقة");
    }
  };

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        <Sidebar
          currentScreen={currentScreen}
          navigateTo={setCurrentScreen}
          circles={circles}
          currentCircleId={currentCircleId}
          onCircleChange={handleCircleChange}
          onCreateCircle={handleCreateCircle}
          role={auth.role}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {currentScreen === "dashboard" && <Dashboard circleId={currentCircleId} />}
          {currentScreen === "students" && <Students circleId={currentCircleId} circles={circles} onStudentsChange={fetchCircles} />}
          {currentScreen === "session" && <SessionEval circleId={currentCircleId} />}
          {currentScreen === "report" && <MonthlyReport circleId={currentCircleId} />}
          {currentScreen === "gamification" && <Gamification circleId={currentCircleId} />}
          {currentScreen === "settings" && auth.role === "admin" && <Settings />}
        </main>
      </div>
    </div>
  );
}

export default App;
