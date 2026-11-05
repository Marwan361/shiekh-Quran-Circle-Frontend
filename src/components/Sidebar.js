import React from "react";

function Sidebar({
  currentScreen,
  navigateTo,
  onLock,
  circles,
  currentCircleId,
  onCircleChange,
  onCreateCircle,
}) {
  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: "🏠" },
    { id: "students", label: "الطلاب", icon: "🎓" },
    { id: "session", label: "تقييم الحصة", icon: "📝" },
    { id: "report", label: "التقرير الشهري", icon: "📊" },
    { id: "gamification", label: "المنافسة والأبطال", icon: "🏆" },
    { id: "settings", label: "الإعدادات", icon: "⚙️" },
  ];

  const handleCreateCircle = () => {
    const name = prompt("أدخل اسم الحلقة الجديدة:");
    if (name && name.trim()) {
      onCreateCircle(name.trim());
    }
  };

  return (
    <aside className="sidebar glass-dark md:h-screen md:w-64 flex md:flex-col flex-row fixed md:relative bottom-0 md:bottom-auto left-0 right-0 md:left-auto md:right-0 z-50 overflow-x-auto md:overflow-y-auto">
      <div className="hidden md:flex flex-col items-center p-6 border-b border-white/10 w-full">
        <div
          className="w-14 h-14 rounded-full gold-bg-gradient flex items-center justify-center text-3xl mb-2"
          style={{ fontFamily: "Amiri", fontWeight: 700, color: "#1a2e2a" }}>
          ق
        </div>
        <h2 className="font-amiri text-xl font-bold text-amber-400">
          حلقة القرآن
        </h2>
      </div>

      <div className="p-3 border-b border-white/10 w-full">
        <div className="flex gap-2 items-center">
          <select
            value={currentCircleId || ""}
            onChange={(e) => onCircleChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-sm border border-white/20">
            {circles.length === 0 && <option value="">لا توجد حلقات</option>}
            {circles.map((circle) => (
              <option
                key={circle._id}
                value={circle._id}
                className="text-gray-800">
                {circle.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateCircle}
            title="إضافة حلقة جديدة"
            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 transition-colors text-lg">
            ➕
          </button>
        </div>
      </div>

      <nav className="flex md:flex-col flex-row gap-1 p-2 md:p-4 md:space-y-1.5 w-full">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`sidebar-item flex md:flex-row flex-col items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-all cursor-pointer text-xs md:text-sm whitespace-nowrap ${
              currentScreen === item.id
                ? "bg-amber-500/20 text-amber-400 font-bold border-amber-500/40"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}>
            <span className="text-lg md:text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="hidden md:block p-4 border-t border-white/10 text-center mt-auto">
        <button
          onClick={onLock}
          className="text-gray-400 hover:text-white text-xs transition-colors flex items-center justify-center gap-1.5 w-full">
          🔒 قفل التطبيق
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
