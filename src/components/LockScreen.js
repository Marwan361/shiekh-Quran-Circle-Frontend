import React, { useState, useRef } from "react";

const PIN_CODE = "123412";

function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setPin(value);
    setError(false);

    if (value.length === 6) {
      setTimeout(() => {
        if (value === PIN_CODE) {
          onUnlock();
        } else {
          setError(true);
          setPin("");
          inputRef.current?.focus();
        }
      }, 250);
    }
  };

  const handleClear = () => {
    setPin("");
    setError(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #064e3b 0%, #065f46 30%, #0a3622 60%, #052e1f 100%)",
        backgroundSize: "200% 200%",
        animation: "gradientBG 8s ease infinite",
      }}>
      {/* Animated floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-amber-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${6 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatParticle {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) scale(1.5); opacity: 0.8; }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.4); }
            50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.8); }
          }
          @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}
      </style>

      <div
        className="glass-dark rounded-[2rem] p-8 md:p-12 w-[94%] max-w-md text-center relative"
        style={{
          animation: "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          backdropFilter: "blur(24px)",
          background: "rgba(6, 78, 59, 0.85)",
          border: "1px solid rgba(212, 175, 55, 0.25)",
        }}>
        {/* Top ornament */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full mb-4" />

        {/* Photo and name */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400/60"
            style={{
              animation:
                "scaleIn 0.8s ease-out, pulseGlow 3s ease-in-out infinite",
            }}>
            <img
              src="https://i.ibb.co/gMRXLRYr/srjg.jpg"
              alt="محمد جميل"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23065f46'/%3E%3Ctext x='50%25' y='50%25' font-size='100' fill='%23d4af37' text-anchor='middle' dominant-baseline='central' font-family='Arial'%3Eم%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <h2
            className="mt-4 text-3xl md:text-4xl font-bold text-amber-400 font-amiri"
            style={{ animation: "fadeInUp 0.8s ease-out 0.2s both" }}>
            محمد جميل
          </h2>
          <p
            className="text-emerald-100/80 text-sm mt-1 font-medium tracking-wide"
            style={{ animation: "fadeInUp 0.8s ease-out 0.4s both" }}>
            محفظ قرآن كريم
          </p>
        </div>

        {/* Title */}
        <h1
          className="font-amiri text-2xl md:text-3xl text-amber-400 font-bold mb-2"
          style={{ animation: "fadeInUp 0.8s ease-out 0.6s both" }}>
          حلقة القرآن الكريم
        </h1>
        <p
          className="text-emerald-200 text-sm mb-6"
          style={{ animation: "fadeInUp 0.8s ease-out 0.7s both" }}>
          نظام الإدارة المتكامل
        </p>

        <p
          className="text-gray-300 text-sm mb-4"
          style={{ animation: "fadeInUp 0.8s ease-out 0.8s both" }}>
          أدخل رمز الدخول المكون من 6 أرقام
        </p>

        {/* PIN boxes */}
        <div
          className="flex justify-center gap-2 md:gap-3 mb-6"
          style={{ animation: "fadeInUp 0.8s ease-out 0.9s both" }}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="pin-box"
              style={{
                width: "48px",
                height: "56px",
                borderRadius: "14px",
                border: "2px solid rgba(212, 175, 55, 0.4)",
                background: "rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "#065f46",
                transition: "all 0.2s ease",
                ...(index < pin.length && {
                  borderColor: "#d4af37",
                  background: "rgba(212, 175, 55, 0.2)",
                  boxShadow: "0 0 16px rgba(212, 175, 55, 0.5)",
                }),
                ...(index === pin.length && {
                  borderColor: "#d4af37",
                  boxShadow: "0 0 24px rgba(212, 175, 55, 0.7)",
                  transform: "scale(1.08)",
                  background: "rgba(212, 175, 55, 0.3)",
                }),
              }}>
              {index < pin.length ? "●" : ""}
            </div>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength="6"
          className="sr-only"
          value={pin}
          onChange={handlePinChange}
          autoFocus
        />

        {error && (
          <p
            className="text-red-400 text-sm mb-4 flex items-center justify-center gap-1"
            style={{ animation: "fadeInUp 0.3s ease" }}>
            <span>⚠️</span> رمز غير صحيح، حاول مرة أخرى
          </p>
        )}

        <button
          onClick={handleClear}
          className="text-gray-300 hover:text-white text-sm transition-colors px-4 py-2 rounded-xl hover:bg-white/10">
          مسح الرمز
        </button>

        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent rounded-full mt-4" />
      </div>
    </div>
  );
}

export default LockScreen;
