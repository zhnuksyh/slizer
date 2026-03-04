import { useEffect, useState } from 'react';
import { getApiUsageStatus } from '../../utils/apiTracker';
import { Zap } from 'lucide-react';

export const ApiUsageMonitor = () => {
    const [usage, setUsage] = useState(getApiUsageStatus());

    useEffect(() => {
        // Update usage stats every 5 seconds to catch minute-window expirations
        // and also whenever localStorage changes (if generated from another tab)
        const interval = setInterval(() => {
            setUsage(getApiUsageStatus());
        }, 5000);

        const handleStorageChange = () => {
            setUsage(getApiUsageStatus());
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('api-usage-updated', handleStorageChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('api-usage-updated', handleStorageChange);
        };
    }, []);

    const rpmPercent = Math.min((usage.usedLastMinute / usage.maxRpm) * 100, 100);
    const dailyPercent = Math.min((usage.usedToday / usage.maxDaily) * 100, 100);

    const isWarningRpm = rpmPercent >= 80;
    const isCriticalRpm = rpmPercent >= 100;

    return (
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
            <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className={isCriticalRpm ? "text-red-500" : isWarningRpm ? "text-yellow-500" : "text-indigo-400"} />
                    API Limits limits
                </span>
                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${isCriticalRpm ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {isCriticalRpm ? 'Rate Limited' : 'Healthy'}
                </span>
            </div>

            {/* RPM Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Per Minute (RPM)</span>
                    <span className="font-mono">{usage.usedLastMinute} / {usage.maxRpm}</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCriticalRpm ? 'bg-red-500' : isWarningRpm ? 'bg-yellow-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${rpmPercent}%` }}
                    />
                </div>
            </div>

            {/* Daily Progress */}
            <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Daily Total (RPD)</span>
                    <span className="font-mono">{usage.usedToday} / {usage.maxDaily}</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-slate-600 rounded-full transition-all duration-500"
                        style={{ width: `${dailyPercent}%` }}
                    />
                </div>
            </div>
            
            {isCriticalRpm && (
                <p className="mt-2 text-[10px] text-red-400 leading-tight">
                    * Please wait ~60s before generating again to avoid API errors.
                </p>
            )}
        </div>
    );
};
