import { NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Calendar, PieChart, Settings, PlusCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const Navbar = () => {
  const [activeStyle, setActiveStyle] = useState({ left: 0, width: 0, height: 0 });
  const navRef = useRef(null);
  const location = useLocation();

  // Set active indicator based on current route
  useEffect(() => {
    const navItems = navRef.current.querySelectorAll('a');
    const activeItem = Array.from(navItems).find(
      item => item.getAttribute('href') === location.pathname
    );
    if (activeItem) {
      setActiveStyle({
        left: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
        height: activeItem.offsetHeight
      });
    }
  }, [location]);

  const handleNavClick = (e) => {
    const target = e.currentTarget;
    setActiveStyle({
      left: target.offsetLeft,
      width: target.offsetWidth,
      height: target.offsetHeight
    });
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 px-8 z-50 flex justify-center pointer-events-none">
      <nav
        ref={navRef}
        className="pointer-events-auto w-full max-w-md bg-[#1F2937]/90 backdrop-blur-lg border border-[#374151] p-1.5 rounded-full shadow-2xl relative"
      >
        <div className="relative flex items-center justify-evenly">
            <NavItem to="/" icon={<HomeIcon size={24} />} onClick={handleNavClick} />
            <NavItem to="/calendar" icon={<Calendar size={24} />} onClick={handleNavClick} />
            <NavItem to="/routine" icon={<PlusCircle size={24} />} onClick={handleNavClick} />
            <NavItem to="/stats" icon={<PieChart size={24} />} onClick={handleNavClick} />
            <NavItem to="/settings" icon={<Settings size={24} />} onClick={handleNavClick} />

            {/* Active indicator */}
            <span
            className="absolute -z-1 bg-[#10B981] rounded-full transition-all duration-300"
            style={{
                left: activeStyle.left,
                width: activeStyle.width,
                height: activeStyle.height
            }}
            />
        </div>
      </nav>
    </div>
  );
};

function NavItem({ to, icon, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex items-center justify-center px-3 py-2 rounded-full transition-all duration-300 ${isActive ? "text-[#3b3b3b]" : "text-[#4B5563] hover:text-[#E5E7EB]"}`
      }
      onClick={onClick}
    >
      {icon}
    </NavLink>
  );
}
