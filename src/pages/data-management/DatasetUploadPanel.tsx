import React from 'react';
import InfoRow from '../../components/InfoRow';
import uploadDatasetIcon from '../../assets/icons/uploadDataset.svg';

type DatasetUploadPanelProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string | null;
  fileSize: number | null;
  totalRecords: number;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveDataset: () => void;
  onOpenFilePicker: () => void;
  totalHours: string;
  uniqueActivityTypes: string;
  dateRange: string;
  uploadTimestamp: string;
};

const DatasetUploadPanel: React.FC<DatasetUploadPanelProps> = ({
  inputRef,
  fileName,
  fileSize,
  totalRecords,
  onFileChange,
  onRemoveDataset,
  onOpenFilePicker,
  totalHours,
  uniqueActivityTypes,
  dateRange
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
        <img src={uploadDatasetIcon} className="h-6 w-6" alt="Upload" />
      </span>
      <div>
        <h2 className="text-xl font-semibold">Dataset Upload</h2>
        <p className="text-sm text-slate-500">Only XLSX files are supported.</p>
      </div>
    </div>

    <button
      type="button"
      onClick={onOpenFilePicker}
      className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
    >
      <span className="mb-3 rounded-full bg-white p-4 text-blue-600 shadow-sm">
        <img src={uploadDatasetIcon} className="h-6 w-6" alt="Upload" />
      </span>
      <span className="text-lg font-semibold text-slate-900">Upload Excel</span>
      <span className="mt-2 text-sm text-slate-500">Drag and drop a file here, or click to browse.</span>
    </button>
    <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onFileChange} />

    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      <InfoRow label="File Name" value={fileName ?? 'No dataset uploaded'} />
      <InfoRow label="File Size" value={fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : '-'} />
      <InfoRow label="Total Records" value={fileName ? totalRecords.toLocaleString() : '-'} />
      <InfoRow label="Total Hours" value={totalHours} />
      <InfoRow label="Unique Activity Types" value={uniqueActivityTypes} />
      <InfoRow label="Date Range" value={dateRange} />
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onOpenFilePicker}
        className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {fileName ? 'Replace Dataset' : 'Upload Dataset'}
      </button>
      <button
        type="button"
        onClick={onRemoveDataset}
        disabled={!fileName}
        className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        Remove Dataset
      </button>
    </div>
  </div>
);

export default DatasetUploadPanel;
