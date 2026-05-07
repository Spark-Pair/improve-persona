import React, { useEffect } from 'react';

export const Card = ({ children, className = '', onClick, noPadding=false }) => (
  <div
    onClick={onClick}
    className={`bg-[#1F2937]/80 backdrop-blur-md border border-white/5 rounded-3xl ${noPadding ? '' : "p-6"} shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-[#3B82F6]/50 active:scale-[0.98]' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const variants = {
    primary: 'bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    secondary: 'bg-[#374151] text-white hover:bg-[#4B5563] border border-white/10',
    outline: 'bg-transparent border border-[#4B5563] text-[#9CA3AF] hover:border-[#E5E7EB] hover:text-[#E5E7EB]',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.classList.add('modal-open');
    } else if (shouldRender) {
      setIsClosing(true);
      document.body.classList.remove('modal-open');
      timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 250);
    }
    return () => {
      if (timer) clearTimeout(timer);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={onClose}
      />
      <div className={`relative w-full max-w-md bg-[#0F172A] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl transform transition-all ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-[#4B5563]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-end justify-between mb-8 px-2">
    <div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      {subtitle && <p className="text-sm font-medium text-[#4B5563] mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Input = ({ label, ...props }) => (
  <div className="mb-6">
    {label && <label className="block text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-2 px-1">{label}</label>}
    <input
      {...props}
      className="w-full bg-[#1F2937]/50 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#3B82F6]/50 transition-all"
    />
  </div>
);
