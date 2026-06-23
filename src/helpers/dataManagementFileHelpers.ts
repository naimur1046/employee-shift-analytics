import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  DataManagementValidationStatus,
  DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS,
  type DataManagementValidationIssueKey,
  type DataManagementPreviewRecord,
  type DataManagementValidationIssue,
} from '../constants/data-management';

export type RawDataRow = Record<string, unknown>;

const TIME_PATTERN = /^(\d{1,2})(?::(\d{2}))?(?:\s*([ap]m))?$/i;
const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const ISSUE_KEY_LOOKUP: Record<string, DataManagementValidationIssueKey> = {
  'missing reason': 'missing-reason',
  'missing activity reason': 'missing-reason',
  'missing activity reasons': 'missing-reason',
  'missing start': 'missing-start',
  'missing start time': 'missing-start',
  'blank start time': 'missing-start',
  'missing end': 'missing-end',
  'missing end time': 'missing-end',
  'blank end time': 'missing-end',
  'invalid date': 'invalid-date',
  'invalid dates': 'invalid-date',
  'invalid time': 'invalid-time',
  'invalid times': 'invalid-time',
  'negative hour': 'negative-hours',
  'negative hours': 'negative-hours',
  'negative duration': 'negative-hours',
  'negative durations': 'negative-hours',
  'hours mismatch': 'hours-mismatch',
  'calculated duration hours': 'hours-mismatch',
  'calculated duration hour': 'hours-mismatch',
  'duplicate entry': 'duplicate-entry',
  'duplicate entries': 'duplicate-entry',
  'duplicate record': 'duplicate-entry',
  'duplicate records': 'duplicate-entry',
  'exact duplicate row': 'exact-duplicate-rows',
  'exact duplicate rows': 'exact-duplicate-rows',
  'exact duplicate record': 'exact-duplicate-rows',
  'exact duplicate records': 'exact-duplicate-rows',
};

const normalizeLookupKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const parseDateValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(DATE_PATTERN);
  if (!match) return null;

  const month = Number.parseInt(match[1], 10);
  const day = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const excelSerialDateToString = (serial: number) => {
  const days = serial > 60 ? serial - 1 : serial;
  const date = new Date(Date.UTC(1899, 11, 31) + Math.round(days * 86400000));
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

const normalizeExcelDateValue = (value: unknown) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return excelSerialDateToString(value);
  if (value instanceof Date) {
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    const year = value.getUTCFullYear();
    return `${month}/${day}/${year}`;
  }

  return String(value).trim();
};

export const parseShiftDateTimeValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateValue = (value: string) => {
  const parsed = parseDateValue(value);
  if (!parsed) return value.trim();

  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
};

export const parseShiftTimeToMinutes = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsedDateTime = parseShiftDateTimeValue(trimmed);
  if (parsedDateTime) {
    return parsedDateTime.getUTCHours() * 60 + parsedDateTime.getUTCMinutes();
  }

  const match = trimmed.match(TIME_PATTERN);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'am') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

export const calculateShiftDurationHours = (shiftStart: string, shiftEnd: string): number | null => {
  const startDateTime = parseShiftDateTimeValue(shiftStart);
  const endDateTime = parseShiftDateTimeValue(shiftEnd);

  if (startDateTime && endDateTime) {
    return (endDateTime.getTime() - startDateTime.getTime()) / 36e5;
  }

  const startMinutes = parseShiftTimeToMinutes(shiftStart);
  const endMinutes = parseShiftTimeToMinutes(shiftEnd);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  const diffMinutes = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 24 * 60 - startMinutes;
  return diffMinutes / 60;
};

export const normalizeValidationIssueKey = (value: string): DataManagementValidationIssueKey => {
  const normalized = normalizeLookupKey(value);
  if (ISSUE_KEY_LOOKUP[normalized]) {
    return ISSUE_KEY_LOOKUP[normalized];
  }

  if (normalized.includes('exact duplicate')) {
    return 'exact-duplicate-rows';
  }
  if (normalized.includes('duplicate')) {
    return 'duplicate-entry';
  }
  if (normalized.includes('hours mismatch') || normalized.includes('calculated duration')) {
    return 'hours-mismatch';
  }
  if (normalized.includes('invalid time')) {
    return 'invalid-time';
  }
  if (normalized.includes('invalid date')) {
    return 'invalid-date';
  }
  if (normalized.includes('missing start')) {
    return 'missing-start';
  }
  if (normalized.includes('missing end')) {
    return 'missing-end';
  }
  if (normalized.includes('negative')) {
    return 'negative-hours';
  }
  if (normalized.includes('reason')) {
    return 'missing-reason';
  }

  return 'duplicate-entry';
};

const buildIssue = (
  key: DataManagementValidationIssueKey,
  status: DataManagementValidationStatus,
  count: number,
): DataManagementValidationIssue => ({
  key,
  status,
  type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS[key],
  count,
});


export const parseExcel = (file: File): Promise<RawDataRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<RawDataRow>(sheet);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const mapRawRowsToRecords = (rows: RawDataRow[]): DataManagementPreviewRecord[] => {
  return rows.map((row) => {
    const keys = Object.keys(row);
    const findValue = (possibleNames: string[]) => {
      const key = keys.find((k) => possibleNames.some((name) => k.toLowerCase() === name.toLowerCase()));
      return key ? row[key] : '';
    };

    const rawDateValue = findValue(['DAY_DATE']);
    const dateStr = formatDateValue(normalizeExcelDateValue(rawDateValue));
    const shiftStart = String(findValue(['START'])).trim();
    const shiftEnd = String(findValue(['END'])).trim();
    const durationRaw = String(findValue(['HOURS'])).trim();
    const reason = String(findValue(['REASON'])).trim();

    const duration = durationRaw ? parseFloat(durationRaw) : 0;
    const parsedDate = parseDateValue(dateStr);
    const startMinutes = parseShiftTimeToMinutes(shiftStart);
    const endMinutes = parseShiftTimeToMinutes(shiftEnd);
    const calculatedDuration = calculateShiftDurationHours(shiftStart, shiftEnd);

    let status = DataManagementValidationStatus.Valid;
    const isInvalidDate = !parsedDate;
    const isMissingReason = !reason;
    const isMissingStart = !shiftStart;
    const isMissingEnd = !shiftEnd;
    const isInvalidStartTime = Boolean(shiftStart) && startMinutes === null;
    const isInvalidEndTime = Boolean(shiftEnd) && endMinutes === null;
    const isNegativeDuration = duration < 0;
    const isHoursMismatch = calculatedDuration !== null && !Number.isNaN(duration) && Math.abs(calculatedDuration - duration) > 0.25;

    if (isInvalidDate || isMissingStart || isMissingEnd || isInvalidStartTime || isInvalidEndTime || isNegativeDuration || isHoursMismatch) {
      status = DataManagementValidationStatus.Error;
    } else if (isMissingReason) {
      status = DataManagementValidationStatus.Warning;
    }

    return {
      date: dateStr,
      shiftStart,
      shiftEnd,
      duration: isNaN(duration) ? 0 : duration,
      reason,
      status,
    };
  });
};

export const analyzeValidationIssues = (
  records: DataManagementPreviewRecord[],
): DataManagementValidationIssue[] => {
  let missingReasonsCount = 0;
  let missingStartCount = 0;
  let missingEndCount = 0;
  let invalidDateCount = 0;
  let invalidTimeCount = 0;
  let negativeHoursCount = 0;
  let hoursMismatchCount = 0;
  let duplicateEntryCount = 0;
  let exactDuplicateRowCount = 0;
  const seenLogical = new Set<string>();
  const seenExact = new Set<string>();

  records.forEach((record) => {
    if (!record.reason) {
      missingReasonsCount++;
    }
    if (!record.shiftStart) {
      missingStartCount++;
    } else if (parseShiftTimeToMinutes(record.shiftStart) === null) {
      invalidTimeCount++;
    }
    if (!record.shiftEnd) {
      missingEndCount++;
    } else if (parseShiftTimeToMinutes(record.shiftEnd) === null) {
      invalidTimeCount++;
    }

    const date = parseDateValue(record.date);
    if (!date) {
      invalidDateCount++;
    }
    if (record.duration < 0) {
      negativeHoursCount++;
    }

    const calculatedDuration = calculateShiftDurationHours(record.shiftStart, record.shiftEnd);
    if (calculatedDuration !== null && !Number.isNaN(record.duration) && Math.abs(calculatedDuration - record.duration) > 0.25) {
      hoursMismatchCount++;
    }

    const logicalSig = `${record.date}|${record.shiftStart}|${record.shiftEnd}|${record.reason}`;
    if (seenLogical.has(logicalSig)) {
      duplicateEntryCount++;
    } else {
      seenLogical.add(logicalSig);
    }

    const exactSig = `${record.date}|${record.shiftStart}|${record.shiftEnd}|${record.duration}|${record.reason}`;
    if (seenExact.has(exactSig)) {
      exactDuplicateRowCount++;
    } else {
      seenExact.add(exactSig);
    }
  });

  return [
    buildIssue('missing-reason', DataManagementValidationStatus.Warning, missingReasonsCount),
    buildIssue('missing-start', DataManagementValidationStatus.Error, missingStartCount),
    buildIssue('missing-end', DataManagementValidationStatus.Error, missingEndCount),
    buildIssue('invalid-date', DataManagementValidationStatus.Error, invalidDateCount),
    buildIssue('invalid-time', DataManagementValidationStatus.Error, invalidTimeCount),
    buildIssue('negative-hours', DataManagementValidationStatus.Error, negativeHoursCount),
    buildIssue('hours-mismatch', DataManagementValidationStatus.Warning, hoursMismatchCount),
    buildIssue('duplicate-entry', DataManagementValidationStatus.Warning, duplicateEntryCount),
    buildIssue('exact-duplicate-rows', DataManagementValidationStatus.Warning, exactDuplicateRowCount),
  ];
};
