export enum DataManagementValidationStatus {
  Valid = 'Valid',
  Warning = 'Warning',
  Error = 'Error',
}

export enum DataManagementSortKey {
  Date = 'date',
  ShiftStart = 'shiftStart',
  ShiftEnd = 'shiftEnd',
  Duration = 'duration',
  Reason = 'reason',
  Status = 'status',
}

export const DATA_MANAGEMENT_VALIDATION_ISSUE_KEYS = [
  'missing-reason',
  'missing-start',
  'missing-end',
  'invalid-date',
  'invalid-time',
  'negative-hours',
  'hours-mismatch',
  'duplicate-entry',
  'exact-duplicate-rows',
] as const;

export type DataManagementValidationIssueKey = (typeof DATA_MANAGEMENT_VALIDATION_ISSUE_KEYS)[number];

export type DataManagementPreviewRecord = {
  date: string;
  shiftStart: string;
  shiftEnd: string;
  duration: number;
  reason: string;
  status: DataManagementValidationStatus;
};

export type DataManagementValidationIssue = {
  key: DataManagementValidationIssueKey;
  status: DataManagementValidationStatus;
  type: string;
  count: number;
};

export type DataManagementCleaningRule = {
  key: DataManagementValidationIssueKey;
  label: string;
  action: string;
};

export const DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS: Record<DataManagementValidationIssueKey, string> = {
  'missing-reason': 'Missing Reason',
  'missing-start': 'Missing Start',
  'missing-end': 'Missing End',
  'invalid-date': 'Invalid Date',
  'invalid-time': 'Invalid Time',
  'negative-hours': 'Negative Hours',
  'hours-mismatch': 'Hours Mismatch',
  'duplicate-entry': 'Duplicate Entry',
  'exact-duplicate-rows': 'Exact Duplicate Rows',
};

export const DATA_MANAGEMENT_CLEANING_RULES: DataManagementCleaningRule[] = [
  { key: 'missing-reason', label: 'Missing Reason', action: 'Replace with "Unknown"' },
  { key: 'missing-start', label: 'Missing Start', action: 'Flag for review' },
  { key: 'missing-end', label: 'Missing End', action: 'Flag for review' },
  { key: 'invalid-date', label: 'Invalid Date', action: 'Exclude invalid records' },
  { key: 'invalid-time', label: 'Invalid Time', action: 'Normalize or flag for review' },
  { key: 'negative-hours', label: 'Negative Hours', action: 'Recalculate duration' },
  { key: 'hours-mismatch', label: 'Hours Mismatch', action: 'Recompute from shift window' },
  { key: 'duplicate-entry', label: 'Duplicate Entry', action: 'Remove duplicates' },
  { key: 'exact-duplicate-rows', label: 'Exact Duplicate Rows', action: 'Remove duplicate rows' },
];

export const DATA_MANAGEMENT_VALIDATION_ISSUES: DataManagementValidationIssue[] = [
  { key: 'missing-reason', status: DataManagementValidationStatus.Warning, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['missing-reason'], count: 0 },
  { key: 'duplicate-entry', status: DataManagementValidationStatus.Warning, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['duplicate-entry'], count: 0 },
  { key: 'negative-hours', status: DataManagementValidationStatus.Error, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['negative-hours'], count: 0 },
  { key: 'invalid-date', status: DataManagementValidationStatus.Error, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['invalid-date'], count: 0 },
  { key: 'missing-start', status: DataManagementValidationStatus.Valid, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['missing-start'], count: 0 },
  { key: 'missing-end', status: DataManagementValidationStatus.Valid, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['missing-end'], count: 0 },
  { key: 'invalid-time', status: DataManagementValidationStatus.Valid, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['invalid-time'], count: 0 },
  { key: 'hours-mismatch', status: DataManagementValidationStatus.Valid, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['hours-mismatch'], count: 0 },
  { key: 'exact-duplicate-rows', status: DataManagementValidationStatus.Valid, type: DATA_MANAGEMENT_VALIDATION_ISSUE_LABELS['exact-duplicate-rows'], count: 0 },
];

export const DATA_MANAGEMENT_STATUS_STYLES: Record<DataManagementValidationStatus, string> = {
  [DataManagementValidationStatus.Valid]: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  [DataManagementValidationStatus.Warning]: 'bg-amber-50 text-amber-700 ring-amber-200',
  [DataManagementValidationStatus.Error]: 'bg-red-50 text-red-700 ring-red-200',
};


export const DATA_MANAGEMENT_PREVIEW_RECORDS: DataManagementPreviewRecord[] = [];
