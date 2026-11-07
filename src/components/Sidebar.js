import React from "react";

function Sidebar({
  currentScreen,
  navigateTo,
  circles,
  currentCircleId,
  onCircleChange,
  onCreateCircle,
  role,
  onLogout,
}) {
  const isAdmin = role === "admin";
  
  // لو مدرس، ميشوفش صفحة الإعدادات
  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: "🏠" },
    { id: "students", label: "الطلاب", icon: "🎓" },
    { id: "session", label: "تقييم الحصة", icon: "📝" },
    { id: "report", label: "التقرير الشهري", icon: "📊" },
    { id: "gamification", label: "المنافسة والأبطال", icon: "🏆" },
  ];
  if (isAdmin) menuItems.push({ id: "settings", label: "الإعدادات", icon: "⚙️" });

  return (
    <aside className="sidebar glass-dark md:h-screen md:w-64 flex md:flex-col flex-row fixed md:relative bottom-0 md:bottom-auto left-0 right-0 md:left-auto md:right-0 z-50 overflow-x-auto md:overflow-y-auto">
      <div className="hidden md:flex flex-col items-center p-6 border-b border-white/10 w-full">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="Logo"
          className="w-16 h-16 rounded-full object-cover mb-2 shadow-lg border-2 border-amber-400"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h2 className="font-amiri text-xl font-bold text-amber-400">مجمع أهل القرآن</h2>
      </div>

      {/* ⭐ قائمة اختيار الحلقة بتظهر للمدير بس */}
      <div className="p-3 border-b border-white/10 w-full">
        {isAdmin ? (
          <div className="flex gap-2 items-center">
            <select
              value={currentCircleId || ""}
              onChange={(e) => onCircleChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-sm border border-white/20">
              {circles.length === 0 && <option value="">لا توجد حلقات</option>}
              {circles.map((circle) => (
                <option key={circle._id} value={circle._id} className="text-gray-800">
                  {circle.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const name = prompt("أدخل اسم الحلقة الجديدة:");
                if (name && name.trim()) onCreateCircle(name.trim());
              }}
              title="إضافة حلقة جديدة"
              className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 transition-colors text-lg">
              ➕
            </button>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-sm text-center font-bold border border-amber-500/20">
            {circles.find(c => c._id === currentCircleId)?.name || "حلقتك"}
          </div>
        )}
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
          onClick={onLogout}
          className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center justify-center gap-1.5 w-full font-bold">
          🚪 تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
