import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import {
  DataManagementValidationStatus,
  type DataManagementPreviewRecord,
} from "../../constants/data-management";
import {
  calculateShiftDurationHours,
  parseDateValue,
  parseShiftTimeToMinutes,
} from "../../helpers/dataManagementFileHelpers";

export const selectShiftRawRecords = (state: RootState) => state.shift.rawRecords;
export const selectShiftIsCleaned = (state: RootState) => state.shift.isCleaned;
export const selectShiftFileName = (state: RootState) => state.shift.selectedFileName;
export const selectShiftFileSize = (state: RootState) => state.shift.selectedFileSize;
export const selectShiftUploadTimestamp = (state: RootState) => state.shift.uploadTimestamp;

export const cleanShiftRecords = (
  records: DataManagementPreviewRecord[]
): DataManagementPreviewRecord[] => {
  const seen = new Set<string>();
  const cleaned: DataManagementPreviewRecord[] = [];

  records.forEach((record) => {
    const d = parseDateValue(record.date);
    if (!d) {
      return;
    }
    const startMinutes = parseShiftTimeToMinutes(record.shiftStart);
    const endMinutes = parseShiftTimeToMinutes(record.shiftEnd);
    if (!record.shiftStart || !record.shiftEnd || startMinutes === null || endMinutes === null) {
      return;
    }

    const reason = record.reason || "Unknown";
    const calculatedDuration = calculateShiftDurationHours(record.shiftStart, record.shiftEnd);
    const duration = calculatedDuration ?? (record.duration < 0 ? Math.abs(record.duration) : record.duration);
    const sig = `${record.date}|${record.shiftStart}|${record.shiftEnd}|${reason}`;
    if (seen.has(sig)) {
      return;
    }
    seen.add(sig);

    cleaned.push({
      date: record.date,
      shiftStart: record.shiftStart,
      shiftEnd: record.shiftEnd,
      duration,
      reason,
      status: DataManagementValidationStatus.Valid,
    });
  });

  return cleaned;
};

export const selectShiftCleanedRecords = createSelector(
  [selectShiftRawRecords],
  (records) => cleanShiftRecords(records)
);

export const selectShiftEffectiveRecords = createSelector(
  [selectShiftRawRecords, selectShiftCleanedRecords, selectShiftIsCleaned],
  (rawRecords, cleanedRecords, isCleaned) => (isCleaned ? cleanedRecords : rawRecords)
);

export const selectHasUploadedShiftData = (state: RootState) =>
  state.shift.rawRecords.length > 0;
