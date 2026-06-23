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
    normalized.includes('failure') ||
    normalized.includes('maintenance') ||
    normalized.includes('repair') ||
    normalized.includes('issue')
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

const Insight: React.FC = () => {
  const rawRecords = useAppSelector(selectShiftRawRecords);
  const records = useAppSelector(selectShiftEffectiveRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);
  const fileName = useAppSelector(selectShiftFileName);

  const breakdownRecords = useMemo(() => {
    return records.filter((record) => isIssueReason(normalizeReason(record.reason)));
  }, [records]);

  const totalEfficiency = useMemo(() => {
    if (records.length === 0) return 0;
    return ((records.length - breakdownRecords.length) / records.length) * 100;
  }, [records, breakdownRecords]);

  const mostFrequentActivity = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((record) => {
      const reason = normalizeReason(record.reason);
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
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

  const longestStreak = streaks.reduce<(typeof streaks)[number] | null>(
    (best, streak) => (!best || streak.length > best.length ? streak : best),
    null,
  );

  const mostProblematicDay = useMemo(() => {
    const counts: Record<string, number> = {};
    breakdownRecords.forEach((record) => {
      counts[record.date] = (counts[record.date] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
  }, [breakdownRecords]);

  const breakdownPercentage = useMemo(() => {
    if (records.length === 0) return 0;
    return (breakdownRecords.length / records.length) * 100;
  }, [records, breakdownRecords]);

  const weekdayStats = useMemo(() => {
    let weekdayCount = 0;
    let weekdayIssues = 0;
    let weekendCount = 0;
    let weekendIssues = 0;

    records.forEach((r) => {
      const d = parseRecordDate(r);
      if (!d) return;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) {
        weekendCount += 1;
        if (isIssueReason(normalizeReason(r.reason))) {
          weekendIssues += 1;
        }
      } else {
        weekdayCount += 1;
        if (isIssueReason(normalizeReason(r.reason))) {
          weekdayIssues += 1;
        }
      }
    });

    const weekdayEff = weekdayCount > 0 ? ((weekdayCount - weekdayIssues) / weekdayCount) * 100 : 100;
    const weekendEff = weekendCount > 0 ? ((weekendCount - weekendIssues) / weekendCount) * 100 : 100;

    return { weekdayEff, weekendEff, weekendIssues };
  }, [records]);

  const shiftPeriodStats = useMemo(() => {
    const counts: Record<string, number> = {};
    breakdownRecords.forEach((record) => {
      const window = getTimeWindow(record.shiftStart);
      counts[window] = (counts[window] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      mostProblematicWindow: sorted[0]?.[0] ?? 'Unknown',
      mostProblematicWindowCount: sorted[0]?.[1] ?? 0,
    };
  }, [breakdownRecords]);

  const dayOfWeekStats = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const stats = days.map((name) => ({ name, count: 0, issues: 0 }));

    records.forEach((r) => {
      const d = parseRecordDate(r);
      if (!d) return;
      const dayIndex = d.getDay();
      stats[dayIndex].count += 1;
      if (isIssueReason(normalizeReason(r.reason))) {
        stats[dayIndex].issues += 1;
      }
    });

    return stats.map((s) => {
      const efficiency = s.count > 0 ? ((s.count - s.issues) / s.count) * 100 : 100;
      return { ...s, efficiency };
    });
  }, [records]);

  const mostEfficientDayName = useMemo(() => {
    const valid = dayOfWeekStats.filter((s) => s.count > 0);
    if (valid.length === 0) return '-';
    return [...valid].sort((a, b) => b.efficiency - a.efficiency)[0].name;
  }, [dayOfWeekStats]);

  const leastEfficientDayName = useMemo(() => {
    const valid = dayOfWeekStats.filter((s) => s.count > 0);
    if (valid.length === 0) return '-';
    return [...valid].sort((a, b) => a.efficiency - b.efficiency)[0].name;
  }, [dayOfWeekStats]);

  if (rawRecords.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">No Dataset Uploaded</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Upload employee shift data first, then recommendations and insights will render from the shared Redux dataset.
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
      <header className="mb-6 flex min-h-[70px] flex-col justify-center gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insights</h1>
          <p className="mt-2 max-w-5xl text-base text-slate-600">
            Generate actionable recommendations from operational data to improve efficiency and reduce recurring issues.
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

      {/* SECTION 1: Summary Cards */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Summary Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operational Efficiency</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{totalEfficiency.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Most Frequent Activity</p>
            <p className="mt-2 text-xl font-bold text-slate-900 truncate" title={mostFrequentActivity}>{mostFrequentActivity}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Longest Breakdown Streak</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{longestStreak ? `${longestStreak.length} days` : '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Most Problematic Day</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{mostProblematicDay}</p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Actionable Insights */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Actionable Insights</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Insight 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-800">Frequent Breakdown Events</h3>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  breakdownPercentage > 20 ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                }`}>
                  {breakdownPercentage > 20 ? 'High' : 'Medium'}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Observation</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    Breakdowns account for {breakdownPercentage.toFixed(1)}% of operational downtime and issues.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Recommendation</p>
                  <p className="mt-0.5 text-slate-600">
                    Schedule preventive maintenance and execute rigorous inspections on the breakdown categories.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Insight 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-800">Weekend Shift Efficiency</h3>
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                  Medium
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Observation</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    Operational efficiency drops to {weekdayStats.weekendEff.toFixed(1)}% on weekends compared to {weekdayStats.weekdayEff.toFixed(1)}% on weekdays.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Recommendation</p>
                  <p className="mt-0.5 text-slate-600">
                    Review weekend staffing levels and resource allocations to improve throughput.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Insight 3 */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-800">Recurring Power Failures</h3>
                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-200">
                  High
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Observation</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    Power failures and issue spikes frequently occur during the {shiftPeriodStats.mostProblematicWindow} shift period ({shiftPeriodStats.mostProblematicWindowCount} events).
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 text-xs uppercase">Recommendation</p>
                  <p className="mt-0.5 text-slate-600">
                    Inspect electrical infrastructure and equipment loading parameters during peak {shiftPeriodStats.mostProblematicWindow} hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Key Findings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Key Findings</h2>
        <p className="text-sm text-slate-500 mb-5">Quick operational takeaways based on the current data state.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Finding Indicator</th>
                <th className="px-4 py-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-600">Most Problematic Activity</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">{mostFrequentActivity}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-600">Most Efficient Day</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">{mostEfficientDayName}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-600">Least Efficient Day</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">{leastEfficientDayName}</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-600">Most Problematic Shift Period</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">{shiftPeriodStats.mostProblematicWindow}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Insight;
