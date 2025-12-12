import { useEffect, useState } from 'react'
import Card from '../common/Card'
import { FireIcon } from '@heroicons/react/24/solid'

// Badge milestones
const BADGES: Record<number, string> = {
    3: "Bronze Starter",
    7: "Bronze",
    15: "Silver",
    30: "Gold",
    50: "Platinum",
    75: "Diamond",
    100: "Universal",
    125: "Cosmic",
    150: "Galaxy",
    200: "Multiverse",
    300: "Infinity",
    400: "Omni",
    500: "Multiverse Voyager"
};

// Helper to normalize date → UTC midnight (SOLVES STREAK BUG)
const normalizeUTC = (date: Date) => {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

function StudyStreak() {
    const [streakDays, setStreakDays] = useState(1);
    const [badge, setBadge] = useState<string | null>(null);

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayIndex = new Date().getDay();

    useEffect(() => {
        const storedStreak = Number(localStorage.getItem("study_streak") || 1);
        const lastDateString = localStorage.getItem("study_streak_last_date");
        const storedBadge = localStorage.getItem("study_streak_badge");

        if (storedBadge) setBadge(storedBadge);

        const today = new Date();
        const todayDateString = today.toDateString();

        // Case 1 → Already counted today
        if (lastDateString === todayDateString) {
            setStreakDays(storedStreak);
            return;
        }

        // Case 2 → Streak existed before
        if (lastDateString) {
            const last = new Date(lastDateString);

            // FIXED LOGIC: Convert to UTC midnight → accurate day difference every time
            const diffDays =
                (normalizeUTC(today) - normalizeUTC(last)) / (1000 * 60 * 60 * 24);

            let newStreak = storedStreak;

            if (diffDays === 1) {
                // Continue streak
                newStreak = storedStreak + 1;
            } else {
                // Missed a day → reset
                newStreak = 1;
            }

            // Save new streak
            localStorage.setItem("study_streak", String(newStreak));
            localStorage.setItem("study_streak_last_date", todayDateString);
            setStreakDays(newStreak);

            // Award badge if milestone hit
            if (BADGES[newStreak]) {
                localStorage.setItem("study_streak_badge", BADGES[newStreak]);
                setBadge(BADGES[newStreak]);
            }
        } else {
            // Case 3 → First-time user
            localStorage.setItem("study_streak", "1");
            localStorage.setItem("study_streak_last_date", todayDateString);
            setStreakDays(1);
        }
    }, []);

    return (
        <Card title="Study Streak" subtitle="Keep your momentum going!">
            {/* TOP STREAK COUNTER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-slate-800 dark:text-white">
                        {streakDays}
                    </span>
                    <div className="text-sm text-slate-500">
                        <p>Days</p>
                        <p>in a row</p>

                        {/* BADGE DISPLAY */}
                        {badge && (
                            <p className="mt-1 font-semibold text-primary-600 dark:text-primary-400">
                                🎖 {badge}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-full bg-orange-100 p-3 text-orange-500 dark:bg-orange-900/30">
                    <FireIcon className="h-8 w-8 animate-pulse" />
                </div>
            </div>

            {/* WEEK STREAK VISUAL */}
            <div className="mt-6 flex justify-between">
                {weekDays.map((day, index) => {
                    const isToday = index === todayIndex;
                    const isActive =
                        index <= todayIndex && index > todayIndex - streakDays;

                    return (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <div
                                className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all ${
                                    isActive
                                        ? "bg-primary-600 text-white shadow-md scale-110"
                                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                }`}
                            >
                                {isActive ? "✓" : ""}
                            </div>
                            <span
                                className={`text-xs ${
                                    isToday
                                        ? "font-bold text-primary-600"
                                        : "text-slate-400"
                                }`}
                            >
                                {day}
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export default StudyStreak;
