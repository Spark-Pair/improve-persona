import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { FeedbackContext } from './feedbackContext';

export const FeedbackProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        variant: 'primary'
    });

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Are you sure?',
                message: options.message || '',
                variant: options.variant || 'primary',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    const [confirmRender, setConfirmRender] = useState(false);
    const [confirmClosing, setConfirmClosing] = useState(false);

    useEffect(() => {
        if (confirmState.isOpen) {
            setConfirmRender(true);
            setConfirmClosing(false);
            document.body.classList.add('modal-open');
        } else if (confirmRender) {
            setConfirmClosing(true);
            document.body.classList.remove('modal-open');
            const timer = setTimeout(() => {
                setConfirmRender(false);
                setConfirmClosing(false);
            }, 250);
            return () => clearTimeout(timer);
        }
        return () => document.body.classList.remove('modal-open');
    }, [confirmState.isOpen]);

    return (
        <FeedbackContext.Provider value={{ showToast, confirm }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-6 left-0 right-0 z-[200] flex flex-col items-center gap-3 pointer-events-none px-6">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl animate-toast-in
              ${toast.type === 'success' ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]' :
                                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    'bg-[#3B82F6]/10 border-[#3B82F6]/20 text-[#3B82F6]'}
            `}
                    >
                        {toast.type === 'success' && <CheckCircle2 size={18} />}
                        {toast.type === 'error' && <AlertCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span className="text-sm font-bold">{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-2 opacity-50 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal Container */}
            {confirmRender && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${confirmClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={confirmState.onCancel} />
                    <div className={`relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[2rem] p-8 shadow-2xl ${confirmClosing ? 'animate-modal-out' : 'animate-confirm-in'}`}>
                        <h3 className="text-xl font-black text-white mb-3">{confirmState.title}</h3>
                        <p className="text-sm font-medium text-[#4B5563] mb-8 leading-relaxed">{confirmState.message}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={confirmState.onCancel}
                                className="flex-1 px-6 py-3 rounded-2xl font-bold text-[#4B5563] hover:bg-white/5 transition-all"
                            >
                                {confirmState.cancelText}
                            </button>
                            <button
                                onClick={confirmState.onConfirm}
                                className={`flex-1 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg
                  ${confirmState.variant === 'danger' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#3B82F6] text-white shadow-[#3B82F6]/20'}
                `}
                            >
                                {confirmState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};
