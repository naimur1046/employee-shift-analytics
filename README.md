# Employee Shift Analytics Dashboard

A modern, responsive React + TypeScript dashboard designed to visualize employee shift patterns, analyze operational performance, detect equipment breakdown streaks, validate data quality, and generate actionable insights from shift records.

---

## 🚀 Key Features

### 📊 1. Main Dashboard
*   **KPI Summary Metrics**: Instantly track **Total Shift Records**, **Average Shift Duration (hrs)**, **Operational Efficiency (%)**, and the **Longest Breakdown Streak (days)**.
*   **Active Dataset Panel**: View file details (name, size), cleaning status (Raw vs. Cleaned), and precise upload timestamps.
*   **Intelligent Routing**: Direct navigation to key analytical modules with visual summaries.

### ⚙️ 2. Data Management & Preprocessing
*   **File Uploader**: Supports drag-and-drop or file pickers for Excel files (`.xlsx`) using `xlsx` parsing.
*   **Data Validation Engine**: Automatically flags:
    *   *Errors*: Invalid dates, invalid times, missing start/end times, and negative durations.
    *   *Warnings*: Missing reasons, calculated vs. recorded hours mismatch (deviation > 15 mins), and duplicates.
*   **One-Click Clean & Preprocess**:
    *   Fills missing reasons with `"Unknown"`.
    *   Filters out rows with invalid dates/times or missing keys.
    *   Recomputes durations from shift start/end times or fixes negative hours.
    *   Deduplicates logical and exact duplicate rows.

### 📈 3. Visual Analytics & Trend Graphs
*   **Flexible Aggregations**: Switch timeline views between **Daily**, **Weekly**, and **Monthly** intervals.
*   **Filters & Controls**: Dynamic range selection (Start/End dates) and activity category filtering.
*   **Interactive Visual Charts**: Custom SVG-based category distribution charts, timelines of shift durations, and interactive lists.

### ⚠️ 4. Breakdown & Downtime Streak Analysis
*   **Consecutive Run Detection**: Evaluates consecutive calendar days where operational issues (breakdown, failure, maintenance, repair) occurred.
*   **Critical Operational Indicators**:
    *   *Longest Streak*: Highlights the longest uninterrupted sequence of issue days.
    *   *Problematic Windows*: Pinpoints which shifts (Morning, Afternoon, Evening, Night) suffer the highest frequency of failure.
    *   *Problematic Days*: Identifies specific dates with maximum breakdown events.

### 💡 5. Actionable Insights
*   Generates optimization suggestions including:
    *   Weekend productivity scheduling.
    *   Power failure mitigation patterns.
    *   Duration distribution alignment advice.

---

## 🛠️ Technology Stack

*   **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + [Redux Persist](https://github.com/rt2zz/redux-persist) (preserving uploaded dataset across page reloads)
*   **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
*   **Bundler**: [Vite](https://vite.dev/)
*   **Libraries**:
    *   `xlsx` (Excel parsing)
    *   `papaparse` (CSV support)
    *   `react-router-dom` (Routing & navigation)

---

## 📂 Project Structure

```text
employee-shift-analytics/
├── src/
│   ├── assets/          # SVG icons & static assets
│   ├── components/      # Reusable UI components (Sidebar, SummaryCard, Footer, etc.)
│   ├── constants/       # Action types, validation definitions, and data constants
│   ├── helpers/         # File parsing, date calculators, and validation logic
│   ├── hooks/           # Custom React/Redux wrapper hooks
│   ├── pages/           # High-level views (Dashboard, Analysis, Insight, etc.)
│   │   └── data-management/  # Specialized file upload and processing views
│   ├── store/           # Redux store setup, slices, and selectors
│   ├── utils/           # Helper utility functions
│   ├── App.tsx          # Main entry layout and router configuration
│   └── main.tsx         # Root DOM renderer
├── index.html           # Document template
├── vite.config.ts       # Vite bundler configurations
└── tsconfig.json        # TypeScript configuration rules
```

---

## 📖 Data Preprocessing & Validation Rules

The application implements a strict ruleset for validating and cleaning imported files:

| Issue Type | Category | Cleaning Action |
| :--- | :--- | :--- |
| **Missing Reason** | Warning | Replaces with `"Unknown"` |
| **Missing Start / End** | Error | Excluded from the cleaned dataset |
| **Invalid Date / Time** | Error | Excluded from the cleaned dataset |
| **Negative Hours** | Error | Automatically recalculated based on shift start/end |
| **Hours Mismatch** | Warning | Corrected to computed duration based on the shift window |
| **Duplicates** | Warning | Deduplicated to keep unique shifts |

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have Node.js (version 18+ recommended) installed.

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   cd employee-shift-analytics
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running the App
*   **Development Server**: Launch the app with hot-reloading at `http://localhost:5173`:
    ```bash
    npm run dev
    ```
*   **Production Build**: Compile and optimize the application:
    ```bash
    npm run build
    ```
*   **Preview Build**: Run the locally compiled production build:
    ```bash
    npm run preview
    ```
*   **Code Linting**: Run ESLint checks:
    ```bash
    npm run lint
    ```

