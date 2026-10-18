export const getUtcDayDiff = (fromDate: Date, toDate: Date): number => {
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return 0;
  }
  const fromUtc = Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    fromDate.getUTCDate(),
  );
  const toUtc = Date.UTC(
    toDate.getUTCFullYear(),
    toDate.getUTCMonth(),
    toDate.getUTCDate(),
  );
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
};

export interface IReadingStreakResult {
  streak: number;
  longestStreak: number;
  lastReadingDate: Date;
  isIncremented: boolean;
}

export const calculateReadingStreak = (
  currentStreak = 0,
  currentLongestStreak = 0,
  lastReadingDate?: Date | null,
  now: Date = new Date(),
): IReadingStreakResult => {
  if (!lastReadingDate) {
    const streak = 1;
    return {
      streak,
      longestStreak: Math.max(currentLongestStreak, streak),
      lastReadingDate: now,
      isIncremented: true,
    };
  }

  const dayDiff = getUtcDayDiff(new Date(lastReadingDate), now);

  if (dayDiff === 0) {
    // Already updated today: retain streak count, update last reading timestamp
    const streak = Math.max(currentStreak, 1);
    return {
      streak,
      longestStreak: Math.max(currentLongestStreak, streak),
      lastReadingDate: now,
      isIncremented: false,
    };
  }

  if (dayDiff === 1) {
    // Consecutive day reading activity!
    const streak = currentStreak + 1;
    return {
      streak,
      longestStreak: Math.max(currentLongestStreak, streak),
      lastReadingDate: now,
      isIncremented: true,
    };
  }

  if (dayDiff > 1) {
    // Broken streak (missed at least one day): restart at 1
    const streak = 1;
    return {
      streak,
      longestStreak: Math.max(currentLongestStreak, streak),
      lastReadingDate: now,
      isIncremented: true,
    };
  }

  // dayDiff < 0 (clock anomaly): keep existing
  return {
    streak: currentStreak,
    longestStreak: currentLongestStreak,
    lastReadingDate,
    isIncremented: false,
  };
};

export const getActiveStreak = (
  streak = 0,
  lastReadingDate?: Date | null,
  now: Date = new Date(),
): number => {
  if (!lastReadingDate || streak <= 0) {
    return 0;
  }
  const dayDiff = getUtcDayDiff(new Date(lastReadingDate), now);
  // Active if read today (0) or yesterday (1)
  if (dayDiff >= 0 && dayDiff <= 1) {
    return streak;
  }
  return 0;
};

