# TaskLapse v3.1.0 — Engineering Audit & Remediation Plan

## Overview
This plan resolves all 5 functional bugs identified during the codebase audit and upgrades the architecture with centralized versioning (`v3.1.0`), shared domain utilities, strict TypeScript contracts, and non-blocking in-app UI notifications/confirmations.

Execution is structured into **3 sequential phases**, pausing after each phase so you can verify and test the changes before proceeding.

---

## Phase 1: Critical Data & Repository Bug Fixes (`v3.1.0` Foundation)
**Objective**: Eliminate data corruption, state desynchronization, and persistence bugs across Cloud and Guest storage repositories, while establishing a single source of truth for `APP_VERSION = '3.1.0'`.

1. **Centralize `APP_VERSION` (`src/utils.ts` & UI consumers)**
   - Export `APP_VERSION = '3.1.0'` from `src/utils.ts` and replace hardcoded `'3.0.1'` strings across `package.json`, `AppContext.tsx`, `Header.tsx`, `Dashboard.tsx`, `AuthScreen.tsx`, and `AboutModal.tsx`.
2. **Fix Webhook Argument Misalignment (`src/components/IntegrationPanel.tsx`)**
   - Update `handleSave` in `IntegrationPanel.tsx` to pass `saveWebhook(url.trim(), undefined, secret.trim())` so saving the webhook URL and authentication secret preserves `webhook.targetEmail` instead of overwriting it with the secret.
3. **Fix Guest Mode Category Persistence (`src/context/AppContext.tsx`)**
   - Update `saveCategories` to persist `localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(newCategories))` whenever `isGuest` is active, ensuring custom categories survive page reloads.
4. **Fix Clearing Optional `expiresDate` in Firestore (`src/services/storage/FirestoreRepository.ts`)**
   - Use Firestore's `deleteField()` when `updates.expiresDate` or `updates.startDate` is explicitly cleared (`undefined` or `''`) in `updateTask`, allowing users to remove an expiration date from an existing cloud-synced task.
5. **Fix Guest Mode Recurring Archive ID Desync (`src/services/storage/ITaskRepository.ts`, `LocalStorageRepository.ts`, `FirestoreRepository.ts`, `AppContext.tsx`)**
   - Update `archiveRecurringTask` to return the created archived `Task` (with its canonical `id`), and use that returned record in `AppContext.tsx` so Guest mode React state and `localStorage` share the exact same UUID.

**Validation Pause 1**: Verify compilation and test webhook saving, Guest category persistence, clearing `expiresDate` on existing items, and immediate deletion of newly archived recurring items.

---

## Phase 2: Recurrence Anchor Preservation, Urgency Sorting & Strict TypeScript Contracts
**Objective**: Ensure multi-cycle recurrence accuracy, chronological urgency ordering on the board, and zero `any` types across domain and context layers.

1. **Multi-Cycle Month-End Anchor Preservation (`src/services/recurrence/RecurrenceEngine.ts`)**
   - Preserve the initial anchor date in `task.startDate` when rolling a recurring task forward (`startDate: task.startDate || task.date`).
   - Derive `anchorDay` in `RecurrenceEngine.rollForwardTask` from `task.startDate || task.date` so multi-cycle check-offs across short months (e.g., `Jan 31 -> Feb 28 -> Mar 31`) never drift to the 28th.
2. **Board Urgency Sorting & DRY Utilities (`src/utils.ts`, `BoardColumns.tsx`, `StatsRow.tsx`, `TaskCard.tsx`, `TaskModal.tsx`, `ArchiveModal.tsx`)**
   - Add shared pure helpers in `src/utils.ts`:
     - `getTaskDaysLeft(task: Task): number` (evaluates `expiresDate` if present, otherwise `date`).
     - `resolveCategoryDef(categories: CategoryDef[], categoryIdOrName?: string): CategoryDef | undefined` (centralizes exact + case-insensitive fallback matching).
   - Update `BoardColumns.tsx` to sort tasks by `getTaskDaysLeft(a) - getTaskDaysLeft(b)` (with tie-breaking by `a.date.localeCompare(b.date)`) so items with urgent expiration dates appear at the top of their column.
3. **Strict TypeScript Interfaces & `TaskModal` Calendar Validation (`src/types.ts`, `UIContext.tsx`, `AppContext.tsx`, `SchemaValidator.ts`, `TaskModal.tsx`)**
   - Define `TriggeredAlertLog` interface in `src/types.ts` and replace `any[]` in `UIContext` and `AppContext`.
   - Replace `rawInput: any` with `unknown` in `SchemaValidator` and `AppContext.importBackupData`.
   - Enforce `SchemaValidator.isValidCalendarDate` in `TaskModal.tsx` when validating `date` and `expiresDate`.

**Validation Pause 2**: Verify compilation and test month-end recurrence roll-forwards, column sorting with mixed `date`/`expiresDate` items, and strict date validation in the task modal.

---

## Phase 3: Non-Blocking UI Notifications & Inline Confirmations
**Objective**: Replace all blocking browser `alert()` and `window.confirm()` dialogs in `Dashboard.tsx` and `SettingsModal.tsx` with a clean, accessible in-app toast/notification banner and inline two-step confirmation buttons.

1. **In-App Toast Notification Banner (`src/context/UIContext.tsx` & `src/components/Dashboard.tsx`)**
   - Add a lightweight `toast` state (`{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null`) and `showToast` helper in `UIContext`.
   - Render a dismissible floating notification banner in `Dashboard.tsx` and replace all `alert()` calls in `handleSimulateAlarm` and `SettingsModal.tsx` with `showToast(...)`.
2. **Inline Two-Step Confirmations in `SettingsModal.tsx`**
   - Replace `window.confirm()` in `handleDisconnect` ("Disconnect Cloud Sync") and `handleDeleteData` ("Delete Offline Local Storage Data") with inline timed confirmation states (`Confirm Disconnect?` / `Confirm Delete All Data?`), matching the UX pattern already used in `TaskCard.tsx` and `ArchiveModal.tsx`.

**Validation Pause 3**: Final verification of alarm simulation notifications, settings actions, and full production build check (`v3.1.0`).
