import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DataManagementPreviewRecord } from '../../constants/data-management';

export interface ShiftState {
  rawRecords: DataManagementPreviewRecord[];
  isCleaned: boolean;
  uploadTimestamp: string;
  selectedFileName: string | null;
  selectedFileSize: number | null;
}

const initialState: ShiftState = {
  rawRecords: [],
  isCleaned: false,
  uploadTimestamp: '-',
  selectedFileName: null,
  selectedFileSize: null,
};

const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    setUploadedData: (
      state,
      action: PayloadAction<{
        rawRecords: DataManagementPreviewRecord[];
        fileName: string;
        fileSize: number;
        timestamp: string;
      }>
    ) => {
      state.rawRecords = action.payload.rawRecords;
      state.selectedFileName = action.payload.fileName;
      state.selectedFileSize = action.payload.fileSize;
      state.uploadTimestamp = action.payload.timestamp;
      state.isCleaned = false;
    },
    clearUploadedData: (state) => {
      state.rawRecords = [];
      state.selectedFileName = null;
      state.selectedFileSize = null;
      state.uploadTimestamp = '-';
      state.isCleaned = false;
    },
    setIsCleaned: (state, action: PayloadAction<boolean>) => {
      state.isCleaned = action.payload;
    },
  },
});

export const { setUploadedData, clearUploadedData, setIsCleaned } = shiftSlice.actions;
export default shiftSlice.reducer;
