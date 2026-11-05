import React from "react";

function CircleSelector({ circles, currentCircleId, onCircleChange }) {
  if (!circles || circles.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {circles.map((circle) => (
        <button
          key={circle._id}
          onClick={() => onCircleChange(circle._id)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            currentCircleId === circle._id
              ? "bg-emerald-700 text-white font-bold"
              : "bg-white/20 text-emerald-100 hover:bg-white/30"
          }`}>
          {circle.name}
        </button>
      ))}
    </div>
  );
}

export default CircleSelector;
