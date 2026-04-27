import React from 'react';
import { Navbar } from './Navbar';

export const Layout = ({ children }) => {
    return (
        <div
            className="min-h-screen bg-[#0F172A] text-[#F9FAFB] font-sans relative overflow-x-hidden"
            style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
        >
            {/* Background Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-64 h-64 bg-[#3B82F6] opacity-5 blur-[100px] rounded-full pointer-events-none" />
            <div className="fixed top-[20%] right-[-10%] w-48 h-48 bg-[#10B981] opacity-5 blur-[80px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[10%] left-[20%] w-56 h-56 bg-[#8B5CF6] opacity-5 blur-[90px] rounded-full pointer-events-none" />

            <main className="max-w-md mx-auto pt-8 px-6 relative z-10">
                {children}
            </main>

            <Navbar />
        </div>
    );
};
