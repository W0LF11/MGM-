/**
 * Centralized TimeManager Utility
 * 
 * Enforces Indian Standard Time (IST - Asia/Kolkata, UTC+05:30) across all game logic,
 * period computations, server-side/client-side betting outcome windows, and temporal audits.
 * India does not observe Daylight Savings Time (DST), maintaining a constant +05:30 offset.
 */

export interface ISTTimeParts {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  hours: number; // 0 - 23
  minutes: number; // 0 - 59
  seconds: number; // 0 - 59
  totalMinutesOfDay: number; // 0 - 1439
  periodIndex5Min: number; // 1 - 288
  periodIndex1Min: number; // 1 - 1440
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:MM:SS"
  timeSlot5Min: string; // "HH:MM" e.g. "17:15"
  timeSlotRange5Min: string; // "17:15 - 17:20"
  periodId: string; // "YYYYMMDD-XXX" e.g. "20260817-208"
  dailyKey: string; // "daily-XXX" e.g. "daily-208"
  formattedIST: string; // "YYYY-MM-DD HH:mm:ss IST"
  remainingSeconds5Min: number; // seconds remaining in current 5-min slot
}

export interface BetISTStamp {
  date: string; // "YYYY-MM-DD"
  timeIST: string; // "YYYY-MM-DD HH:mm:ss IST"
  period: string; // "YYYYMMDD-XXX"
  dailyKey: string; // "daily-XXX"
  periodIndex: number;
  timestamp: number;
}

export class TimeManager {
  private static serverTimeOffsetMs: number = 0;

  /**
   * Universal Date parser that safely handles:
   * - Custom IST strings (e.g., "2026-08-19 14:05:30 IST", "2026-08-19 14:05:30")
   * - Standard ISO-8601 strings (e.g., "2026-08-19T08:35:00.000Z")
   * - Milliseconds timestamps / epoch numbers
   * - Firestore Timestamp objects ({ seconds, nanoseconds } or { toDate: () => Date })
   * - Native JavaScript Date instances
   */
  public static parseDate(val: any): Date {
    if (val === null || val === undefined || val === '') {
      return new Date(this.now());
    }

    if (val instanceof Date) {
      return isNaN(val.getTime()) ? new Date(this.now()) : val;
    }

    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date(this.now()) : d;
    }

    if (typeof val === 'object') {
      if (typeof val.toDate === 'function') {
        try {
          const d = val.toDate();
          if (d instanceof Date && !isNaN(d.getTime())) return d;
        } catch (e) {
          // ignore
        }
      }
      if (typeof val.seconds === 'number') {
        const ms = val.seconds * 1000 + (typeof val.nanoseconds === 'number' ? Math.floor(val.nanoseconds / 1000000) : 0);
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }
    }

    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return new Date(this.now());

      // Strip trailing "IST" if present
      const cleaned = trimmed.replace(/\s+IST$/i, '').trim();

      // Check for YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss patterns without timezone
      const match = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\.(\d+))?(Z|([+-]\d{2}:?\d{2}))?$/i);
      if (match) {
        const [, y, mo, d, h, mi, s, ms, tz] = match;
        if (tz) {
          const parsed = new Date(cleaned);
          if (!isNaN(parsed.getTime())) return parsed;
        }
        // If no explicit timezone specified, assume it was stamped in IST (+05:30)
        const sec = s || '00';
        const msec = ms ? `.${ms}` : '';
        const isoWithIST = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${mi.padStart(2, '0')}:${sec.padStart(2, '0')}${msec}+05:30`;
        const parsedWithTz = new Date(isoWithIST);
        if (!isNaN(parsedWithTz.getTime())) return parsedWithTz;
      }

      // Try standard native parser
      const standardParsed = new Date(trimmed);
      if (!isNaN(standardParsed.getTime())) return standardParsed;

      const cleanedParsed = new Date(cleaned);
      if (!isNaN(cleanedParsed.getTime())) return cleanedParsed;
    }

    return new Date(this.now());
  }

  /**
   * Synchronize local client time with server/cloud timestamp
   */
  public static syncServerTime(serverTimestampMs: number): void {
    if (typeof serverTimestampMs === 'number' && !isNaN(serverTimestampMs)) {
      this.serverTimeOffsetMs = serverTimestampMs - Date.now();
    }
  }

  /**
   * Get current timestamp corrected with server offset
   */
  public static now(): number {
    return Date.now() + this.serverTimeOffsetMs;
  }

  /**
   * Returns exact IST time components for any given date or timestamp
   */
  public static getParts(baseDate: any = this.now()): ISTTimeParts {
    const d = this.parseDate(baseDate);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const partMap: Record<string, string> = {};
    parts.forEach(p => {
      partMap[p.type] = p.value;
    });

    const year = parseInt(partMap.year) || 2026;
    const month = parseInt(partMap.month) || 1;
    const day = parseInt(partMap.day) || 1;
    let hours = parseInt(partMap.hour) || 0;
    if (hours === 24) hours = 0;
    const minutes = parseInt(partMap.minute) || 0;
    const seconds = parseInt(partMap.second) || 0;

    const totalMinutesOfDay = hours * 60 + minutes;
    const periodIndex5Min = Math.floor(totalMinutesOfDay / 5) + 1;
    const periodIndex1Min = totalMinutesOfDay + 1;

    const idx5MinStr = String(periodIndex5Min).padStart(3, '0');
    const yyyymmdd = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const slotStartMin = Math.floor(minutes / 5) * 5;
    const timeSlot5Min = `${String(hours).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;

    const slotEndMin = (slotStartMin + 5) % 60;
    const slotEndHr = slotStartMin + 5 >= 60 ? (hours + 1) % 24 : hours;
    const timeSlotRange5Min = `${timeSlot5Min} - ${String(slotEndHr).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;

    const periodId = `${yyyymmdd}-${idx5MinStr}`;
    const dailyKey = `daily-${idx5MinStr}`;
    const formattedIST = `${dateStr} ${timeStr} IST`;

    const remainingSeconds5Min = 300 - ((minutes % 5) * 60 + seconds);

    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      totalMinutesOfDay,
      periodIndex5Min,
      periodIndex1Min,
      dateStr,
      timeStr,
      timeSlot5Min,
      timeSlotRange5Min,
      periodId,
      dailyKey,
      formattedIST,
      remainingSeconds5Min
    };
  }

  /**
   * Formats a timestamp into an IST time string: "HH:mm" (e.g. "21:35" or "14:05")
   * Guaranteed never to return "Invalid Date".
   */
  public static formatTime(val: any, includeSeconds: boolean = false): string {
    if (val === null || val === undefined || val === '') return '';
    const parts = this.getParts(val);
    const hh = String(parts.hours).padStart(2, '0');
    const mm = String(parts.minutes).padStart(2, '0');
    if (includeSeconds) {
      const ss = String(parts.seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return `${hh}:${mm}`;
  }

  /**
   * Formats a timestamp into a full readable IST date & time string: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
   */
  public static formatDateTime(val: any, includeSeconds: boolean = true): string {
    if (val === null || val === undefined || val === '') return 'N/A';
    const parts = this.getParts(val);
    const hh = String(parts.hours).padStart(2, '0');
    const mm = String(parts.minutes).padStart(2, '0');
    if (includeSeconds) {
      const ss = String(parts.seconds).padStart(2, '0');
      return `${parts.dateStr} ${hh}:${mm}:${ss}`;
    }
    return `${parts.dateStr} ${hh}:${mm}`;
  }

  /**
   * Formats a timestamp into an IST date string: "YYYY-MM-DD"
   */
  public static formatDateOnly(val: any): string {
    if (val === null || val === undefined || val === '') return 'N/A';
    return this.getParts(val).dateStr;
  }

  /**
   * Get current or target 5-minute period ID (e.g. "20260817-208")
   */
  public static getPeriod(baseDate: Date | number = this.now()): string {
    return this.getParts(baseDate).periodId;
  }

  /**
   * Get current or target 5-minute daily key (e.g. "daily-208")
   */
  public static getDailyKey(baseDate: Date | number = this.now()): string {
    return this.getParts(baseDate).dailyKey;
  }

  /**
   * Get current 5-minute period index (1 - 288)
   */
  public static getPeriodIndex(baseDate: Date | number = this.now()): number {
    return this.getParts(baseDate).periodIndex5Min;
  }

  /**
   * Get seconds remaining in the current 5-minute gaming cycle
   */
  public static getRemainingSeconds(baseDate: Date | number = this.now()): number {
    return this.getParts(baseDate).remainingSeconds5Min;
  }

  /**
   * Get the start time of the current 5-minute window (e.g. "17:15")
   */
  public static getTimeSlot(baseDate: Date | number = this.now()): string {
    return this.getParts(baseDate).timeSlot5Min;
  }

  /**
   * Get formatted IST string e.g. "2026-08-17 17:15:30 IST"
   */
  public static formatIST(baseDate: Date | number = this.now()): string {
    return this.getParts(baseDate).formattedIST;
  }

  /**
   * Calculates a period ID with an offset of 5-minute intervals (e.g. +1 for next, -1 for previous)
   */
  public static getPeriodWithOffset(offset5Min: number, baseDate: Date | number = this.now()): string {
    const d = typeof baseDate === 'number' ? new Date(baseDate) : baseDate;
    const offsetMs = offset5Min * 5 * 60 * 1000;
    const offsetDate = new Date(d.getTime() + offsetMs);
    return this.getParts(offsetDate).periodId;
  }

  /**
   * Calculates full IST parts with an offset of 5-minute intervals
   */
  public static getPartsWithOffset(offset5Min: number, baseDate: Date | number = this.now()): ISTTimeParts {
    const d = typeof baseDate === 'number' ? new Date(baseDate) : baseDate;
    const offsetMs = offset5Min * 5 * 60 * 1000;
    const offsetDate = new Date(d.getTime() + offsetMs);
    return this.getParts(offsetDate);
  }

  /**
   * Generates candidate override keys for a temporal window to match against user/global overrides.
   * Covers: Current period, Daily repeating key, Current time slot, Adjacent previous/next windows for boundary tolerance.
   */
  public static getCandidatePeriodKeys(periodIdOrDate?: string | Date | number): string[] {
    let targetDate = new Date(this.now());
    if (typeof periodIdOrDate === 'string' && periodIdOrDate.includes('-')) {
      const parts = periodIdOrDate.split('-');
      const pIdx = parts[1];
      const dailyKey = `daily-${pIdx}`;
      return [periodIdOrDate, dailyKey];
    } else if (periodIdOrDate instanceof Date) {
      targetDate = periodIdOrDate;
    } else if (typeof periodIdOrDate === 'number') {
      targetDate = new Date(periodIdOrDate);
    }

    const current = this.getParts(targetDate);
    const prev = this.getPartsWithOffset(-1, targetDate);
    const next = this.getPartsWithOffset(1, targetDate);

    return [
      current.periodId,
      current.dailyKey,
      current.timeSlot5Min,
      prev.periodId,
      prev.dailyKey,
      next.periodId,
      next.dailyKey
    ];
  }

  /**
   * Checks if an override slot matches the current or provided temporal window
   */
  public static matchesTemporalWindow(targetSlot: string, currentWindowPeriod?: string | Date | number): boolean {
    if (!targetSlot || targetSlot === 'any') return true;
    const candidates = this.getCandidatePeriodKeys(currentWindowPeriod);
    return candidates.includes(targetSlot);
  }

  /**
   * Helper to calculate Period & Time Range from manual user inputs (e.g. from Admin UI in IST)
   */
  public static calculatePeriodFromInput(dateStr: string, hourStr: string, minuteStr: string, isRepeating: boolean) {
    const hrVal = parseInt(hourStr) || 0;
    const minVal = parseInt(minuteStr) || 0;
    const periodIndex = Math.floor((hrVal * 60 + minVal) / 5) + 1;
    const idxStr = String(periodIndex).padStart(3, '0');

    const cleanDateStr = dateStr || this.getParts().dateStr;
    const parts = cleanDateStr.split('-');
    const yyyymmdd = parts.length === 3 ? `${parts[0]}${parts[1]}${parts[2]}` : this.getParts().dateStr.replace(/-/g, '');

    const periodId = isRepeating ? `daily-${idxStr}` : `${yyyymmdd}-${idxStr}`;
    const endMin = (minVal + 5) % 60;
    const endHr = minVal + 5 >= 60 ? (hrVal + 1) % 24 : hrVal;
    const timeStr = `${String(hrVal).padStart(2, '0')}:${String(minVal).padStart(2, '0')} - ${String(endHr).padStart(2, '0')}:${String(endMin).padStart(2, '0')} (IST)`;

    return { periodId, timeStr, periodIndex, idxStr };
  }

  /**
   * Creates a tamper-proof Bet IST Stamp for atomic bet tracking
   */
  public static createBetISTStamp(baseDate: Date | number = this.now()): BetISTStamp {
    const parts = this.getParts(baseDate);
    return {
      date: parts.dateStr,
      timeIST: parts.formattedIST,
      period: parts.periodId,
      dailyKey: parts.dailyKey,
      periodIndex: parts.periodIndex5Min,
      timestamp: typeof baseDate === 'number' ? baseDate : baseDate.getTime()
    };
  }
}

// Standalone function exports for backward compatibility & easy functional imports
export const getISTParts = (baseDate?: any) => TimeManager.getParts(baseDate);
export const getISTPeriod = (baseDate?: any) => TimeManager.getPeriod(baseDate);
export const getISTRemainingSeconds = (baseDate?: any) => TimeManager.getRemainingSeconds(baseDate);
export const getISTTimeSlot = (baseDate?: any) => TimeManager.getTimeSlot(baseDate);
export const getISTPeriodIndex = (baseDate?: any) => TimeManager.getPeriodIndex(baseDate);
export const getISTPeriodWithOffset = (offset5Min: number, baseDate?: any) => TimeManager.getPeriodWithOffset(offset5Min, baseDate);
export const getISTPartsWithOffset = (offset5Min: number, baseDate?: any) => TimeManager.getPartsWithOffset(offset5Min, baseDate);
export const getCandidatePeriodKeys = (periodIdOrDate?: any) => TimeManager.getCandidatePeriodKeys(periodIdOrDate);
export const calculateISTPeriodFromInput = (dateStr: string, hourStr: string, minuteStr: string, isRepeating: boolean) => 
  TimeManager.calculatePeriodFromInput(dateStr, hourStr, minuteStr, isRepeating);
export const getISTTimestamp = (baseDate?: any) => TimeManager.now();
export const formatISTTime = (val: any, includeSeconds?: boolean) => TimeManager.formatTime(val, includeSeconds);
export const formatISTDateTime = (val: any, includeSeconds?: boolean) => TimeManager.formatDateTime(val, includeSeconds);
export const formatISTDateOnly = (val: any) => TimeManager.formatDateOnly(val);
export const parseISTDate = (val: any) => TimeManager.parseDate(val);
