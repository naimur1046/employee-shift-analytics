import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import shiftReducer from "./slices/shiftSlice";

const localStorageAdapter = {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({
  shift: shiftReducer,
});

const persistConfig = {
  key: "employee-shift-analytics",
  storage: localStorageAdapter,
  whitelist: ["shift"],
};

export const mainReducer = persistReducer(persistConfig, rootReducer);
