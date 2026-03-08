import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(interval); return 100; }
                return prev + Math.random() * 15 + 5;
            });
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-[9999]" dir="rtl">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-30%] right-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/8 blur-[120px]"
                    style={{ animation: 'pulse 3s ease-in-out infinite' }} />
                <div className="absolute bottom-[-30%] left-[-20%] w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-[120px]"
                    style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: '1.5s' }} />
            </div>

            {/* Logo animation */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Animated rings */}
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"
                        style={{ animation: 'spin-slow 8s linear infinite' }} />
                    <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20"
                        style={{ animation: 'spin-slow 6s linear infinite reverse' }} />
                    <div className="absolute inset-4 rounded-full border-2 border-cyan-500/20"
                        style={{ animation: 'spin-slow 4s linear infinite' }} />

                    {/* Center logo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-blue-500/30"
                            style={{ animation: 'logo-appear 0.8s ease-out forwards' }}>
                            <span className="text-white font-bold text-4xl">K</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-3"
                    style={{ animation: 'fade-up 0.8s ease-out 0.3s both' }}>
                    Kaslot
                </h1>
                <p className="text-slate-400 text-lg mb-10"
                    style={{ animation: 'fade-up 0.8s ease-out 0.5s both' }}>
                    טוענים את הנתונים שלך...
                </p>

                {/* Progress bar */}
                <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden"
                    style={{ animation: 'fade-up 0.8s ease-out 0.7s both' }}>
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                {/* Dots animation */}
                <div className="flex gap-2 mt-6"
                    style={{ animation: 'fade-up 0.8s ease-out 0.9s both' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                            style={{ animation: 'bounce-dot 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes logo-appear {
          from { transform: scale(0) rotate(-180deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
        </div>
    );
}
