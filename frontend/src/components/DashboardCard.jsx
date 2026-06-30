import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Dashboard Card component.
 * Converts key performance indicators into clickable shortcut links with custom hover effects.
 * 
 * @param {Object} props
 * @param {string} props.title - Card title label
 * @param {string|number} props.value - Dynamic statistic value
 * @param {React.ComponentType} props.icon - Lucide React icon component
 * @param {string} props.linkPath - Navigation path via react-router-dom
 * @param {string} [props.color='#bfa15f'] - Theme color hex code for icon background, icon, and hover border
 * @param {string} [props.sub] - Optional sub-label or description
 */
export default function DashboardCard({ title, value, icon: Icon, linkPath, color = '#bfa15f', sub }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={linkPath}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white border rounded-xl p-5 flex items-start gap-4 transition-all duration-300 cursor-pointer select-none"
      style={{
        borderColor: isHovered ? color : '#e7e5e4', // '#e7e5e4' corresponds to border-stone-200
        boxShadow: isHovered 
          ? `0 10px 15px -3px ${color}15, 0 4px 6px -4px ${color}10` 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // standard shadow-sm
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300"
        style={{
          background: `${color}15`, // Appends alpha for opacity (8-9% opacity)
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-800 leading-tight truncate">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-slate-400 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </Link>
  );
}
