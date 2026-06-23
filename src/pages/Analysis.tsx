import React, { useMemo, useState } from 'react';
import previewTableIcon from '../assets/icons/previewTable.svg';
import {
  DATA_MANAGEMENT_STATUS_STYLES,
  DataManagementSortKey,
  DataManagementValidationStatus,
} from '../constants/data-management';
import { useAppSelector } from '../store/hooks';
import {
  selectShiftEffectiveRecords,
  selectShiftIsCleaned,
} from '../store/selectors/shiftSelectors';

type SortKey = DataManagementSortKey;

const sortColumns: Array<[SortKey, string]> = [
  [DataManagementSortKey.Date, 'Date'],
  [DataManagementSortKey.ShiftStart, 'Shift Start'],
  [DataManagementSortKey.ShiftEnd, 'Shift End'],
  [DataManagementSortKey.Duration, 'Duration'],
  [DataManagementSortKey.Reason, 'Reason'],
  [DataManagementSortKey.Status, 'Status'],
];

const normalizeRecordText = (value: string) => value.toLowerCase();
const normalizeReason = (reason: string) => reason.trim() || 'Unknown';
const statusOptions = Object.values(DataManagementValidationStatus);

const Analysis: React.FC = () => {
  const records = useAppSelector(selectShiftEffectiveRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>(DataManagementSortKey.Date);
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<DataManagementValidationStatus | 'all'>('all');
  const [selectedReason, setSelectedReason] = useState('all');

  const reasonOptions = useMemo(() => {
    return Array.from(new Set(records.map((record) => normalizeReason(record.reason)))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesSearch =
          !term || Object.values(record).some((value) => normalizeRecordText(String(value)).includes(term));
        const reason = normalizeReason(record.reason);
        const matchesReason = selectedReason === 'all' || reason === selectedReason;
        const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
        return matchesSearch && matchesReason && matchesStatus;
      })
      .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]), undefined, { numeric: true }));
  }, [records, search, selectedReason, selectedStatus, sortKey]);

  const rowsPerPage = 5;
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage));
  const visibleRecords = filteredRecords.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-6 text-slate-900">
      <header className="mb-6 flex min-h-[70px] flex-col justify-center gap-2">
        <h1 className="text-3xl font-bold">Analysis</h1>
        <p className="mt-1 max-w-4xl text-base text-slate-600">
          Review the cleaned dataset before continuing with downstream operational analysis.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <img src={previewTableIcon} className="h-6 w-6" alt="Table preview" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Preview Table</h2>
              <p className="text-sm text-slate-500">Review the dataset before continuing.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search records"
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={selectedReason}
              onChange={(event) => {
                setSelectedReason(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Reasons</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value as DataManagementValidationStatus | 'all');
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {sortColumns.map(([key, label]) => (
                  <th key={key} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey(key);
                        setPage(1);
                      }}
                      className={`font-semibold transition hover:text-blue-600 ${
                        sortKey === key ? 'text-blue-600' : ''
                      }`}
                    >
                      {label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRecords.length > 0 ? (
                visibleRecords.map((record) => (
                  <tr key={`${record.date}-${record.shiftStart}-${record.reason}`} className="border-t border-slate-100">
                    <td className="px-4 py-3">{record.date}</td>
                    <td className="px-4 py-3">{record.shiftStart}</td>
                    <td className="px-4 py-3">{record.shiftEnd}</td>
                    <td className="px-4 py-3">{record.duration} hrs</td>
                    <td className="px-4 py-3">{record.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${DATA_MANAGEMENT_STATUS_STYLES[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={6}>
                    No preview records available for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {pageCount} {isCleaned ? '(Cleaned)' : '(Raw)'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={page === pageCount}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analysis;
