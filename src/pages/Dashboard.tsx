import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import {
  selectShiftEffectiveRecords,
  selectShiftFileName,
  selectShiftIsCleaned,
  selectShiftRawRecords,
  selectShiftFileSize,
  selectShiftUploadTimestamp,
} from '../store/selectors/shiftSelectors';
import type { DataManagementPreviewRecord } from '../constants/data-management';
import { parseDateValue } from '../helpers/dataManagementFileHelpers';

const parseRecordDate = (record: DataManagementPreviewRecord) => {
  return parseDateValue(record.date);
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const normalizeReason = (reason: string) => reason.trim() || 'Unknown';

const isIssueReason = (reason: string) => {
  const normalized = reason.toLowerCase();
  return (
    normalized.includes('breakdown') ||
    normalized.includes('failure') ||
    normalized.includes('maintenance') ||
    normalized.includes('repair') ||
    normalized.includes('issue')
  );
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Dashboard: React.FC = () => {
  const rawRecords = useAppSelector(selectShiftRawRecords);
  const records = useAppSelector(selectShiftEffectiveRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);
  const fileName = useAppSelector(selectShiftFileName);
  const fileSize = useAppSelector(selectShiftFileSize);
  const uploadTimestamp = useAppSelector(selectShiftUploadTimestamp);

  const breakdownRecords = useMemo(() => {
    return records.filter((record) => isIssueReason(normalizeReason(record.reason)));
  }, [records]);

  const totalEfficiency = useMemo(() => {
    if (records.length === 0) return 0;
    return ((records.length - breakdownRecords.length) / records.length) * 100;
  }, [records, breakdownRecords]);

  const avgDuration = useMemo(() => {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    return total / records.length;
  }, [records]);

  const streaks = useMemo(() => {
    const issueDates = Array.from(
      new Set(
        breakdownRecords
          .map((record) => parseRecordDate(record))
          .filter((date): date is Date => Boolean(date))
          .map(toDateInputValue),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const result: { start: string; end: string; length: number }[] = [];
    let activeStart = '';
    let previousDate = '';

    issueDates.forEach((dateValue) => {
      if (!activeStart) {
        activeStart = dateValue;
        previousDate = dateValue;
        return;
      }

      const previous = new Date(previousDate);
      previous.setDate(previous.getDate() + 1);

      if (toDateInputValue(previous) === dateValue) {
        previousDate = dateValue;
        return;
      }

      result.push({
        start: activeStart,
        end: previousDate,
        length: Math.round((new Date(previousDate).getTime() - new Date(activeStart).getTime()) / 86400000) + 1,
      });
      activeStart = dateValue;
      previousDate = dateValue;
    });

    if (activeStart) {
      result.push({
        start: activeStart,
        end: previousDate,
        length: Math.round((new Date(previousDate).getTime() - new Date(activeStart).getTime()) / 86400000) + 1,
      });
    }

    return result;
  }, [breakdownRecords]);

  const longestStreakLength = useMemo(() => {
    if (streaks.length === 0) return 0;
    return Math.max(...streaks.map((s) => s.length));
  }, [streaks]);

  if (rawRecords.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-6 text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">No Data Uploaded</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Welcome to the Employee Shift Analytics Dashboard. Get started by uploading your shift schedule and operational dataset.
          </p>
          <Link
            to="/data-management"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Data Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-6 text-slate-900">
      <header className="mb-6 flex min-h-[70px] flex-col justify-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-base text-slate-600">Overview of operational metrics, shift data quality, and breakdown periods.</p>
      </header>

      {/* Dataset Summary Row */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Active Dataset Details</h2>
            <p className="text-sm text-slate-500 mt-1">Currently loaded operational schedule data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {fileName} ({formatBytes(fileSize || 0)})
            </span>
            <span className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              isCleaned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {isCleaned ? 'Cleaned' : 'Raw Data'}
            </span>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          Uploaded at: <span className="font-semibold text-slate-600">{uploadTimestamp || '-'}</span>
        </div>
      </section>

      {/* Main Metrics grid */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Shift Records</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{records.length.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Shift Duration</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{avgDuration.toFixed(1)} hrs</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operational Efficiency</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totalEfficiency.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Longest Streak</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{longestStreakLength} days</p>
        </div>
      </section>

      {/* Navigation shortcuts */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Visual Insights</h3>
            <p className="mt-2 text-sm text-slate-500">
              Track operational timelines, category distributions, and daily productivity trends over time.
            </p>
          </div>
          <Link
            to="/visualization"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            View Charts
          </Link>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Breakdown Streaks</h3>
            <p className="mt-2 text-sm text-slate-500">
              Identify recurring equipment breakdown runs, maximum streaks, and problematic shift windows.
            </p>
          </div>
          <Link
            to="/breakdown-streak"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Track Streaks
          </Link>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Actionable Recommendations</h3>
            <p className="mt-2 text-sm text-slate-500">
              Review custom generated optimization actions, weekend scheduling shifts, and power failure mitigation strategies.
            </p>
          </div>
          <Link
            to="/insight"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            View Recommendations
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
