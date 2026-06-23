import React, { useMemo, useState } from 'react';
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

type Aggregation = 'daily' | 'weekly' | 'monthly';

type TimelineRow = {
  key: string;
  label: string;
  total: number;
  categories: Record<string, number>;
  count: number;
  issueCount: number;
};

const chartPalette = [
  '#2563eb',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#64748b',
];

const distributionOrder = ['Breakdown', 'Power Failure', 'Maintenance', 'Other', 'Unknown Failure'];

const formatHours = (hours: number) =>
  `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} hrs`;

const parseRecordDate = (record: DataManagementPreviewRecord) => {
  return parseDateValue(record.date);
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const getWeekStart = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  return copy;
};

const getPeriodKey = (date: Date, aggregation: Aggregation) => {
  if (aggregation === 'monthly') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  if (aggregation === 'weekly') {
    return toDateInputValue(getWeekStart(date));
  }

  return toDateInputValue(date);
};

const getPeriodLabel = (key: string, aggregation: Aggregation) => {
  const date = new Date(key);
  if (aggregation === 'monthly') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  if (aggregation === 'weekly') {
    return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

const buildArcPath = (cx: number, cy: number, radius: number, startPercent: number, endPercent: number) => {
  const startAngle = startPercent * Math.PI * 2 - Math.PI / 2;
  const endAngle = endPercent * Math.PI * 2 - Math.PI / 2;
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy + radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy + radius * Math.sin(endAngle);
  const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

  return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

const Visualization: React.FC = () => {
  const rawRecords = useAppSelector(selectShiftRawRecords);
  const records = useAppSelector(selectShiftEffectiveRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);
  const fileName = useAppSelector(selectShiftFileName);

  const validDates = useMemo(() => records.map(parseRecordDate).filter((date): date is Date => Boolean(date)), [records]);
  const minDate = validDates.length > 0 ? new Date(Math.min(...validDates.map((date) => date.getTime()))) : null;
  const maxDate = validDates.length > 0 ? new Date(Math.max(...validDates.map((date) => date.getTime()))) : null;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReason, setSelectedReason] = useState('all');
  const [aggregation, setAggregation] = useState<Aggregation>('daily');

  const reasonOptions = useMemo(() => {
    return Array.from(new Set(records.map((record) => normalizeReason(record.reason)))).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = parseRecordDate(record);
      if (!date) return false;
      if (startDate && date < new Date(startDate)) return false;
      if (endDate && date > new Date(`${endDate}T23:59:59`)) return false;
      return selectedReason === 'all' || normalizeReason(record.reason) === selectedReason;
    });
  }, [records, startDate, endDate, selectedReason]);

  const categories = useMemo(() => {
    return Array.from(new Set(filteredRecords.map((record) => normalizeReason(record.reason)))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [filteredRecords]);

  const categoryColors = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category, index) => {
      acc[category] = chartPalette[index % chartPalette.length];
      return acc;
    }, {});
  }, [categories]);

  const timelineRows = useMemo(() => {
    const grouped = new Map<string, TimelineRow>();

    filteredRecords.forEach((record) => {
      const date = parseRecordDate(record);
      if (!date) return;

      const key = getPeriodKey(date, aggregation);
      const reason = normalizeReason(record.reason);
      const row = grouped.get(key) ?? {
        key,
        label: getPeriodLabel(key, aggregation),
        total: 0,
        categories: {},
        count: 0,
        issueCount: 0,
      };

      row.total += record.duration || 0;
      row.categories[reason] = (row.categories[reason] || 0) + (record.duration || 0);
      row.count += 1;
      row.issueCount += isIssueReason(reason) ? 1 : 0;
      grouped.set(key, row);
    });

    return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredRecords, aggregation]);

  const maxTimelineTotal = Math.max(...timelineRows.map((row) => row.total), 1);

  const distributionData = useMemo(() => {
    const totals = distributionOrder.reduce<Record<string, number>>((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {});

    filteredRecords.forEach((record) => {
      const reason = normalizeReason(record.reason);
      const matchedCategory = distributionOrder.find((category) => category.toLowerCase() === reason.toLowerCase()) ?? 'Other';
      totals[matchedCategory] = (totals[matchedCategory] || 0) + (record.duration || 0);
    });

    const totalHours = Object.values(totals).reduce((sum, hours) => sum + hours, 0);
    return distributionOrder.reduce<
      {
        name: string;
        hours: number;
        percent: number;
        color: string;
        start: number;
        end: number;
      }[]
    >((items, name, index) => {
      const hours = totals[name] || 0;
      const percent = totalHours > 0 ? (hours / totalHours) * 100 : 0;
      const start = items[items.length - 1]?.end ?? 0;
      const end = start + (totalHours > 0 ? hours / totalHours : 0);

      return [
        ...items,
        {
        name,
        hours,
        percent,
        color: chartPalette[index % chartPalette.length],
        start,
          end,
        },
      ];
    }, []);
  }, [filteredRecords]);

  const efficiencyRows = useMemo(() => {
    return timelineRows.map((row) => {
      const efficiency = row.count > 0 ? Math.max(0, Math.min(100, ((row.count - row.issueCount) / row.count) * 100)) : 0;
      return { ...row, efficiency };
    });
  }, [timelineRows]);

  const averageEfficiency =
    efficiencyRows.length > 0 ? efficiencyRows.reduce((sum, row) => sum + row.efficiency, 0) / efficiencyRows.length : 0;
  const peakEfficiency = efficiencyRows.reduce<(typeof efficiencyRows)[number] | null>(
    (best, row) => (!best || row.efficiency > best.efficiency ? row : best),
    null,
  );
  const lowestEfficiency = efficiencyRows.reduce<(typeof efficiencyRows)[number] | null>(
    (best, row) => (!best || row.efficiency < best.efficiency ? row : best),
    null,
  );

  const linePoints = efficiencyRows.map((row, index) => {
    const x = efficiencyRows.length === 1 ? 260 : 40 + (index / Math.max(1, efficiencyRows.length - 1)) * 460;
    const y = 220 - (row.efficiency / 100) * 180;
    return { ...row, x, y };
  });
  const averageY = 220 - (averageEfficiency / 100) * 180;



  if (rawRecords.length === 0) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-6 py-6 text-slate-900">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">No Dataset Uploaded</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Upload employee shift data first, then visual summaries will render from the shared Redux dataset.
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
          <h1 className="text-3xl font-bold">Visualizations</h1>
          <p className="mt-2 max-w-5xl text-base text-slate-600">
            Transform operational data into meaningful visual insights and discover trends, patterns, and recurring
            operational issues over time.
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

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">
            Date Range
            <input
              type="date"
              value={startDate}
              min={minDate ? toDateInputValue(minDate) : undefined}
              max={maxDate ? toDateInputValue(maxDate) : undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            End Date
            <input
              type="date"
              value={endDate}
              min={minDate ? toDateInputValue(minDate) : undefined}
              max={maxDate ? toDateInputValue(maxDate) : undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Reason Filter
            <select
              value={selectedReason}
              onChange={(event) => setSelectedReason(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Reasons</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Aggregation
            <select
              value={aggregation}
              onChange={(event) => setAggregation(event.target.value as Aggregation)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Shift Activity Timeline</h2>
            <p className="mt-1 text-sm text-slate-500">Visualize all operational activities over time.</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <span key={category} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: categoryColors[category] }} />
                {category}
              </span>
            ))}
          </div>

          <div className="h-96 overflow-x-auto border-b border-slate-200">
            <div className="flex h-full min-w-full items-end gap-3 px-1 pb-4">
              {timelineRows.map((row) => (
                <div key={row.key} className="flex h-full min-w-16 flex-1 flex-col justify-end gap-2">
                  <div className="flex flex-1 items-end">
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-t-lg bg-slate-100"
                      style={{ height: `${Math.max(8, (row.total / maxTimelineTotal) * 100)}%` }}
                      title={`${row.label}: ${formatHours(row.total)}`}
                    >
                      {categories.map((category) => {
                        const hours = row.categories[category] || 0;
                        if (hours <= 0) return null;
                        return (
                          <div
                            key={category}
                            style={{
                              height: `${(hours / row.total) * 100}%`,
                              backgroundColor: categoryColors[category],
                            }}
                            title={`${category}: ${formatHours(hours)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="truncate text-center text-[11px] font-semibold text-slate-500">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Activity Distribution</h2>
            <p className="mt-1 text-sm text-slate-500">Understand how operational hours are distributed across activity categories.</p>
            <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr] md:items-center">
              <svg viewBox="0 0 220 220" role="img" aria-label="Activity distribution pie chart" className="mx-auto h-60 w-60">
                {distributionData.some((item) => item.hours > 0) ? (
                  distributionData.map((item) =>
                    item.hours > 0 ? (
                      <path key={item.name} d={buildArcPath(110, 110, 100, item.start, item.end)} fill={item.color}>
                        <title>{`${item.name}: ${item.percent.toFixed(1)}%, ${formatHours(item.hours)}`}</title>
                      </path>
                    ) : null,
                  )
                ) : (
                  <circle cx="110" cy="110" r="90" fill="#e2e8f0" />
                )}
              </svg>
              <div className="space-y-3">
                {distributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2" title={`${item.percent.toFixed(1)}%, ${formatHours(item.hours)}`}>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{item.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Operational Efficiency Over Time</h2>
            <p className="mt-1 text-sm text-slate-500">Track operational performance.</p>
            <div className="mt-6 overflow-x-auto">
              <svg viewBox="0 0 560 260" role="img" aria-label="Operational efficiency line chart" className="h-80 min-w-[560px]">
                <line x1="40" y1="220" x2="520" y2="220" stroke="#cbd5e1" />
                <line x1="40" y1="40" x2="40" y2="220" stroke="#cbd5e1" />
                <line x1="40" y1={averageY} x2="520" y2={averageY} stroke="#f59e0b" strokeDasharray="6 6" />
                <text x="425" y={Math.max(16, averageY - 8)} className="fill-amber-600 text-xs font-semibold">
                  Avg {averageEfficiency.toFixed(1)}%
                </text>
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  points={linePoints.map((point) => `${point.x},${point.y}`).join(' ')}
                />
                {linePoints.map((point) => {
                  const isPeak = peakEfficiency?.key === point.key;
                  const isLowest = lowestEfficiency?.key === point.key;
                  return (
                    <g key={point.key}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isPeak || isLowest ? 6 : 4}
                        fill={isPeak ? '#10b981' : isLowest ? '#ef4444' : '#2563eb'}
                      >
                        <title>{`${point.label}: ${point.efficiency.toFixed(1)}% efficiency`}</title>
                      </circle>
                      {(isPeak || isLowest) && (
                        <text x={point.x - 22} y={point.y - 12} className="fill-slate-700 text-xs font-semibold">
                          {isPeak ? 'Peak' : 'Lowest'}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>


      </div>
    </div>
  );
};

export default Visualization;
