import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import {
  selectShiftEffectiveRecords,
  selectShiftFileName,
  selectShiftIsCleaned,
  selectShiftRawRecords,
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
    normalized.includes('power failure') ||
    normalized.includes('unknown failure') ||
    normalized.includes('machine jam')
  );
};

const getTimeWindow = (shiftStart: string) => {
  const hour = Number.parseInt(shiftStart.split(':')[0], 10);
  if (Number.isNaN(hour)) return 'Unknown';
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
};


const BreakdownStreak: React.FC = () => {
  const rawRecords = useAppSelector(selectShiftRawRecords);
  const records = useAppSelector(selectShiftEffectiveRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);
  const fileName = useAppSelector(selectShiftFileName);

  const breakdownRecords = useMemo(() => {
    return records.filter((record) => isIssueReason(normalizeReason(record.reason)));
  }, [records]);

  const breakdownBars = useMemo(() => {
    const counts: Record<string, number> = {};
    breakdownRecords.forEach((record) => {
      const reason = normalizeReason(record.reason);
      counts[reason] = (counts[reason] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: breakdownRecords.length > 0 ? (count / breakdownRecords.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [breakdownRecords]);

  const maxBreakdownCount = Math.max(...breakdownBars.map((item) => item.count), 1);
  const breakdownPercentage = records.length > 0 ? (breakdownRecords.length / records.length) * 100 : 0;

  const mostProblematicDay = useMemo(() => {
    const counts: Record<string, number> = {};
    breakdownRecords.forEach((record) => {
      counts[record.date] = (counts[record.date] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
  }, [breakdownRecords]);

  const mostProblematicTimeWindow = useMemo(() => {
    const counts: Record<string, number> = {};
    breakdownRecords.forEach((record) => {
      const window = getTimeWindow(record.shiftStart);
      counts[window] = (counts[window] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
  }, [breakdownRecords]);

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

  const longestStreak = streaks.reduce<(typeof streaks)[number] | null>(
    (best, streak) => (!best || streak.length > best.length ? streak : best),
    null,
  );
  const currentStreak = streaks[streaks.length - 1] ?? null;

  if (rawRecords.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">No Dataset Uploaded</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Upload employee shift data first, then breakdown streaks will render from the shared Redux dataset.
          </p>
          <Link
            to="/data-management"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Data Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-6 text-slate-900">
      <header className="mb-5 flex min-h-[70px] flex-col justify-center gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Breakdown Streaks</h1>
          <p className="mt-2 max-w-5xl text-base text-slate-600">
            Analyze breakdown patterns, frequency, and track consecutive days of operational issues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm">
            {fileName}
          </span>
          <span
            className={`rounded-lg border px-4 py-2.5 text-xs font-bold shadow-sm ${
              isCleaned ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {isCleaned ? 'Cleaned Dataset' : 'Raw Dataset'}
          </span>
        </div>
      </header>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Breakdown Analysis</h2>
          <p className="mt-1 text-sm text-slate-500">Combine breakdown frequency and operational issues into a single visualization.</p>
          <div className="mt-6 space-y-4">
            {breakdownBars.length > 0 ? (
              breakdownBars.map((item) => (
                <div key={item.name} className="grid gap-2 md:grid-cols-[220px_1fr_110px] md:items-center">
                  <span className="truncate text-sm font-semibold text-slate-700">{item.name}</span>
                  <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-red-500 pr-3 text-xs font-bold text-white"
                      style={{ width: `${Math.max(6, (item.count / maxBreakdownCount) * 100)}%` }}
                      title={`${item.name}: ${item.count} occurrences, ${item.percent.toFixed(1)}%`}
                    >
                      {item.count}
                    </div>
                  </div>
                  <span className="text-right text-sm font-bold text-slate-900">{item.percent.toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                No breakdown-related records found for the current filters.
              </p>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Breakdowns</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{breakdownRecords.length.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Breakdown Percentage</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{`${breakdownPercentage.toFixed(1)}%`}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Most Problematic Day</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{mostProblematicDay}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Most Problematic Time Window</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{mostProblematicTimeWindow}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Breakdown Streak Timeline</h2>
              <p className="mt-1 text-sm text-slate-500">Visualize recurring breakdown periods.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Longest Streak</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{longestStreak ? `${longestStreak.length} days` : '-'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Streak</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{currentStreak ? `${currentStreak.length} days` : '-'}</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Streak Length</th>
                </tr>
              </thead>
              <tbody>
                {streaks.length > 0 ? (
                  streaks.map((streak) => (
                    <tr key={`${streak.start}-${streak.end}`} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-700">{streak.start}</td>
                      <td className="px-4 py-3 text-slate-600">{streak.end}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{streak.length} days</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-100">
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No recurring breakdown periods found for the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BreakdownStreak;
