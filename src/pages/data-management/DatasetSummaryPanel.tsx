import React from 'react';
import summaryDatabaseIcon from '../../assets/icons/summaryDatabase.svg';
import SummaryCard from '../../components/SummaryCard';

type DatasetSummaryPanelProps = {
  selectedFile: File | null;
  totalRecords: number;
  isCleaned: boolean;
};

const DatasetSummaryPanel: React.FC<DatasetSummaryPanelProps> = ({
  selectedFile,
  totalRecords,
  isCleaned,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
        <img src={summaryDatabaseIcon} className="h-6 w-6" alt="Database" />
      </span>
      <div>
        <h2 className="text-xl font-semibold">Dataset Summary</h2>
        <p className="text-sm text-slate-500">A quick readiness snapshot.</p>
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <SummaryCard label="Total Records" value={selectedFile ? totalRecords.toLocaleString() : '-'} tone="blue" />
      <SummaryCard label="Total Hours" value={selectedFile ? '9,824' : '-'} tone="emerald" />
      <SummaryCard label="Unique Activity Types" value={selectedFile ? '12' : '-'} tone="amber" />
      <SummaryCard label="Date Range" value={selectedFile ? 'Jun 1 - Jun 30' : '-'} tone="slate" />
    </div>
    <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
      <p className="text-sm text-slate-300">Is this dataset clean and ready for analysis?</p>
      <p className="mt-2 text-2xl font-bold">
        {isCleaned ? 'Ready for analysis' : selectedFile ? 'Cleaning recommended' : 'Upload required'}
      </p>
    </div>
  </div>
);

export default DatasetSummaryPanel;
