import React, { useMemo, useRef } from 'react';
import {
  DATA_MANAGEMENT_CLEANING_RULES,
  DATA_MANAGEMENT_STATUS_STYLES,
  DataManagementValidationStatus,
} from '../../constants/data-management';
import DatasetUploadPanel from './DatasetUploadPanel';
import SummaryCard from '../../components/SummaryCard';
import validationShieldIcon from '../../assets/icons/validationShield.svg';
import cleaningSparklesIcon from '../../assets/icons/cleaningSparkles.svg';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUploadedData, clearUploadedData, setIsCleaned } from '../../store/slices/shiftSlice';
import {
  selectShiftCleanedRecords,
  selectShiftFileName,
  selectShiftFileSize,
  selectShiftIsCleaned,
  selectShiftRawRecords,
  selectShiftUploadTimestamp,
} from '../../store/selectors/shiftSelectors';
import {
  analyzeValidationIssues,
  mapRawRowsToRecords,
  parseExcel,
  type RawDataRow,
} from '../../helpers/dataManagementFileHelpers';

const statusStyles = DATA_MANAGEMENT_STATUS_STYLES;


const DataManagement: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const dispatch = useAppDispatch();
  const records = useAppSelector(selectShiftRawRecords);
  const cleanedRecords = useAppSelector(selectShiftCleanedRecords);
  const isCleaned = useAppSelector(selectShiftIsCleaned);
  const uploadTimestamp = useAppSelector(selectShiftUploadTimestamp);
  const fileName = useAppSelector(selectShiftFileName);
  const fileSize = useAppSelector(selectShiftFileSize);

  const totalRecords = records.length;

  const totalHoursStr = useMemo(() => {
    if (records.length === 0) return '-';
    const sum = records.reduce((acc, r) => acc + (r.duration || 0), 0);
    return sum.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }, [records]);

  const uniqueActivityTypesStr = useMemo(() => {
    if (records.length === 0) return '-';
    const unique = new Set(records.map((r) => r.reason || 'Unknown'));
    return String(unique.size);
  }, [records]);

  const dateRangeStr = useMemo(() => {
    const dates = records
      .map((r) => r.date)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()));
    if (dates.length === 0) return '-';
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`;
  }, [records]);

  const validationIssues = useMemo(() => {
    return analyzeValidationIssues(records);
  }, [records]);


  const recordsAfterCleaning = isCleaned ? cleanedRecords.length : totalRecords;
  const removedRecordsCount = isCleaned ? String(totalRecords - cleanedRecords.length) : '-';
  const fixedRecordsCount = isCleaned
    ? String(records.filter((r) => r.status !== DataManagementValidationStatus.Valid).length)
    : '-';

  const successRate = useMemo(() => {
    if (!isCleaned || totalRecords === 0) return '-';
    return `${((cleanedRecords.length / totalRecords) * 100).toFixed(1)}%`;
  }, [totalRecords, cleanedRecords, isCleaned]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const timestamp = new Date().toLocaleString();

      try {
        let rawRows: RawDataRow[] = [];

        if (file.name.endsWith('.xlsx')) {
          rawRows = await parseExcel(file);
        }

        const mapped = mapRawRowsToRecords(rawRows);
        dispatch(setUploadedData({
          rawRecords: mapped,
          fileName: file.name,
          fileSize: file.size,
          timestamp,
        }));
      } catch (err) {
        console.error('Error parsing file:', err);
      }
    }
  };

  const removeDataset = () => {
    dispatch(clearUploadedData());
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-6 text-slate-900">
      <header className="mb-6 flex min-h-[70px] flex-col justify-center">
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="mt-2 text-base text-slate-600">Upload, validate, and prepare employee shift data for analysis.</p>
      </header>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <DatasetUploadPanel
          inputRef={inputRef}
          fileName={fileName}
          fileSize={fileSize}
          totalRecords={totalRecords}
          onFileChange={handleFileChange}
          onRemoveDataset={removeDataset}
          onOpenFilePicker={() => inputRef.current?.click()}
          totalHours={totalHoursStr}
          uniqueActivityTypes={uniqueActivityTypesStr}
          dateRange={dateRangeStr}
          uploadTimestamp={uploadTimestamp}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <img src={validationShieldIcon} className="h-6 w-6" alt="Data Validation Report" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Data Validation Report</h2>
              <p className="text-sm text-slate-500">Automatically detect operational inconsistencies.</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1fr_1.5fr_.6fr] bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              <span>Status</span><span>Issue Type</span><span className="text-right">Count</span>
            </div>
            {validationIssues.map((issue) => (
              <div key={issue.key} className="grid grid-cols-[1fr_1.5fr_.6fr] items-center border-t border-slate-100 px-4 py-3 text-sm">
                <span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[issue.status]}`}>
                    {issue.status}
                  </span>
                </span>
                <span className="font-medium text-slate-700">{issue.type}</span>
                <span className="text-right font-semibold">{issue.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <img src={cleaningSparklesIcon} className="h-6 w-6" alt="Data Cleaning Center" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Data Cleaning Center</h2>
              <p className="text-sm text-slate-500">Automate cleaning and track what changed.</p>
            </div>
          </div>
          <div className="space-y-3">
            {DATA_MANAGEMENT_CLEANING_RULES.map((rule) => (
              <div key={rule.key} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-800">{rule.label}</span>
                <span className="text-sm text-slate-500">{rule.action}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => dispatch(setIsCleaned(true))}
              disabled={records.length === 0}
              className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Auto Clean Dataset
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cleaning Summary</h2>
            <p className="text-sm text-slate-500 mt-1">Review the quality improvements and cleaned records statistics.</p>
            <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-3">
              <SummaryCard label="Before Cleaning" value={records.length > 0 ? totalRecords.toLocaleString() : '-'} tone="slate" />
              <SummaryCard label="After Cleaning" value={records.length > 0 ? recordsAfterCleaning.toLocaleString() : '-'} tone="emerald" />
              <SummaryCard label="Removed Records" value={removedRecordsCount} tone="red" />
              <SummaryCard label="Fixed Records" value={fixedRecordsCount} tone="blue" />
              <SummaryCard label="Success Rate" value={successRate} tone="amber" />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default DataManagement;
