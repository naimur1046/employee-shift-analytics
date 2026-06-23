import React from 'react';
import { NavLink } from 'react-router-dom';
import analysisIcon from '../assets/icons/analysis.png';
import breakdownStreaksIcon from '../assets/icons/breakdownStreaks.png';
import dashboardIcon from '../assets/icons/dashboard.png';
import dataManagementIcon from '../assets/icons/dataManagement.png';
import insightsIcon from '../assets/icons/insight.png';
import visualizationsIcon from '../assets/icons/visualizations.png';

const LeftSidebar: React.FC = () => {
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: dashboardIcon },
    { label: 'Data Management', path: '/data-management', icon: dataManagementIcon },
    { label: 'Analysis', path: '/analysis', icon: analysisIcon },
    { label: 'Visualizations', path: '/visualization', icon: visualizationsIcon },
    { label: 'Breakdown Streaks', path: '/breakdown-streak', icon: breakdownStreaksIcon },
    { label: 'Insights', path: '/insight', icon: insightsIcon },
  ];

  return (
    <aside className="group min-h-screen w-20 overflow-hidden bg-[#111827] px-3 py-6 text-[#F3F4F6] transition-all duration-300 ease-in-out hover:w-72">
      <nav aria-label="Main navigation">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex h-14 items-center gap-4 rounded-md px-4 text-base font-semibold transition-colors duration-150',
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-[#F3F4F6] hover:bg-[#374151] hover:text-white',
                  ].join(' ')
                }
              >
                <img className="h-7 w-7 shrink-0 object-contain" src={item.icon} alt="" aria-hidden="true" />
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default LeftSidebar;
