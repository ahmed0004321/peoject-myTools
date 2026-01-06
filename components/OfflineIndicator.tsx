import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OfflineIndicator: React.FC = () => {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-rose-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-rose-500/20 flex items-center gap-3 font-bold text-sm border border-rose-400/50 backdrop-blur-md">
                <div className="p-1.5 bg-white/10 rounded-full animate-pulse">
                    <WifiOff size={16} />
                </div>
                <div>
                    <p>You are offline</p>
                    <p className="text-[10px] opacity-80 font-normal">AI features limited. Data saves locally.</p>
                </div>
            </div>
        </div>
    );
};

export default OfflineIndicator;
