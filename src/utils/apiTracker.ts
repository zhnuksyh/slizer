// `src/utils/apiTracker.ts`

// Gemini free tier limits
const MAX_DAILY_REQUESTS = 1500;
const MAX_REQUESTS_PER_MINUTE = 15;
const STORAGE_KEY = 'slydex_api_usage';

interface UsageStatus {
    usedToday: number;
    maxDaily: number;
    usedLastMinute: number;
    maxRpm: number;
    isRateLimited: boolean;
}

/**
 * Returns the current API usage status based on logged timestamps
 */
export const getApiUsageStatus = (): UsageStatus => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return {
                usedToday: 0,
                maxDaily: MAX_DAILY_REQUESTS,
                usedLastMinute: 0,
                maxRpm: MAX_REQUESTS_PER_MINUTE,
                isRateLimited: false
            };
        }

        const timestamps: number[] = JSON.parse(stored);
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Clean up old timestamps
        const validTimestamps = timestamps.filter(ts => ts > oneDayAgo);

        // Count limits
        const usedToday = validTimestamps.length;
        const usedLastMinute = validTimestamps.filter(ts => ts > oneMinuteAgo).length;

        // Is rate limited?
        const isRateLimited = usedLastMinute >= MAX_REQUESTS_PER_MINUTE || usedToday >= MAX_DAILY_REQUESTS;

        return {
            usedToday,
            maxDaily: MAX_DAILY_REQUESTS,
            usedLastMinute,
            maxRpm: MAX_REQUESTS_PER_MINUTE,
            isRateLimited
        };
    } catch (e) {
        console.error("Failed to parse API usage data", e);
        return {
            usedToday: 0,
            maxDaily: MAX_DAILY_REQUESTS,
            usedLastMinute: 0,
            maxRpm: MAX_REQUESTS_PER_MINUTE,
            isRateLimited: false
        };
    }
};

/**
 * Records a successful API call in local storage
 */
export const recordApiCall = (): void => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let timestamps: number[] = [];

        if (stored) {
            timestamps = JSON.parse(stored);
        }

        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        // Add new, filter out old
        timestamps.push(now);
        timestamps = timestamps.filter(ts => ts > oneDayAgo);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
        window.dispatchEvent(new Event('api-usage-updated'));
    } catch (e) {
        console.error("Failed to save API usage data", e);
    }
};
