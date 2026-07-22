# Changelog

## v2.8.1
- **Bug Fix**: Addressed a runtime issue where `tasks` was improperly scoped in the Dashboard rendering logic.

## v2.8.0
- **Daily Alarm Simulation**: Restored the original healthy condition notification message ("Alarm System Check: All active items are in healthy condition...") when no alerts are triggered during simulation.
- **Date Handling Accuracy**: Reverted the `calculateDaysLeft` time parser to perfectly match the original SPA's exact time evaluation logic, resolving the bug where selecting "today" in the calendar displayed an incorrect offset.
- **Recurrence Settings**: Added missing "Every Week" and "Every 2 Years" options to the recurrence dropdown selector.

## v2.7.14
- **Archive Modal Details**: Restored the expanded details layout in the Completed History & Archives modal, displaying category badges, original expiry dates, detailed notes, and the styled "Delete Record" action exactly as shown in the original SPA.

## v2.7.13
- **Urgency Columns**: Refined the visual grouping boundaries: "Due In Days" now strictly bounds items `<= 7` days, while "Due In Weeks" correctly bounds items `<= 31` days. This resolves column mismatches for 8-day items.
- **Alarm Accuracy**: Changed the simulated email trigger logic to fire on *exact* threshold days (exactly 30 days, 7 days, 1 day, or 0 days left) rather than indiscriminately firing on every intervening day.

## v2.7.12
- **Urgency Color Coding Fix**: Adjusted the color coding logic in the task cards so that only items due in 1 day or less (or expired) appear in red. Items due in 2-14 days now correctly display in amber.
- **Alarm Simulation Logic**: Restored the original notification evaluation logic to the Simulate Alarm function, ensuring it correctly counts triggered alerts based on each task's custom 30d/7d/1d alert thresholds.

## v2.7.11
- **Recurring Tasks**: Re-added the "Does this repeat / recur?" dropdown option in the track item modal.
- **Alert Preferences**: Restored the "When should we email you alerts?" section with multi-select checkboxes for 30d, 7d, and 1-day threshold configurations.

## v2.7.10
- **Category Filter Drag-to-Scroll**: Implemented drag-to-scroll (mouse down and drag) functionality on the category filter bar for easier horizontal navigation without requiring a trackpad or scroll wheel.
- **Track New Item Relocation**: Re-styled and moved the "Track New Item" action button into the Global Stats Row as the primary action card, removing it from the category filter bar to completely eliminate overlap issues.
- **Category Overlap Fix**: Removed the trailing button from the category filters container, allowing the categories list to utilize the full horizontal space securely.

## v2.7.9
- **Button Swapped**: Swapped the "Track New Item" button with the "Simulate Daily Alarm" button to prioritize frequent actions and refine the header layout.
- **Category Filter Scrolling**: Finalized the flexbox constraints (`min-w-0` and `shrink-0`) to ensure the category filter bar scrolls horizontally without overlapping or pushing action buttons off-screen.
- **Webhook State Reloading**: Fixed the React effect dependencies to correctly synchronize webhook credentials when switching between connected accounts, ensuring the Integration Panel loads existing secrets properly upon login.

## v2.7.8
- **Category Filter Scrolling**: Updated the category filter bar container to flex-1 and min-w-0, preventing the "Simulate Alarm" button from overlapping category names while allowing full horizontal scrolling.
- **Webhook State Loading**: Fixed a bug where webhook settings from existing connected accounts were overriding and dropping the authentication secret during partial updates.

## v2.7.7
- **UI Architecture Refinements**: Reintroduced the Global Stats Row directly below the Header to display 'Total Tracked', 'Due in Days', 'Due in Weeks', and 'Due in Months' tracking metrics at a glance.
- **Empty States**: Added a clean dashed-border empty state UI for columns when no items are currently due to improve structural layout stability.
- **Action Management**: Re-added a robust `Delete` action directly to task cards to enhance item management functionality.
- **Badge Styling**: Updated the Global Cloud Sync badge indicator to reflect a success (Emerald) styling to align with original SPA layout.

## v2.7.6
- **Missing Integrations Panel**: Restored the "Triggered Email Notifications" and "Cloud Notification Integrations" UI panels to the bottom of the main dashboard as they were in the original SPA.
- **Webhook Authentication**: Added the Webhook Authentication Secret field to the integrations panel.
- **Dashboard Layout Fix**: Adjusted the category filter bar layout to ensure the "Simulate Daily Alarm Check" button aligns properly horizontally on one line, with hidden scrollbars for the category overflow.
- **Brand Assets**: Restored the original TaskLapse SVG logo and favicon to the application.

## v2.7.5
- **Icon Resolution Fallback**: Implemented a fallback mechanism to correctly display emojis for users with legacy icon text strings saved in their local storage or database, ensuring that icons are visibly correctly instead of as text.
- **Dashboard Layout Polish**: Adjusted the flex container for the Category Filter bar and the "Simulate Daily Alarm Check" button to properly align the button on the right on large screens and handle overflow correctly.

## v2.7.4
- **Emoji Categories**: Transitioned category icons from line icons back to colorful emojis to better match the visual identity of the previous version.
- **Settings Reverted Design**: Updated the System Settings modal to match the previous SPA layout, including simulated target email, account diagnostics, backup/migration controls, and cloud sync disconnect options.
- **Category Filter Bar & Alarm Simulator**: Brought back the category filter bar and the prominent "Simulate Daily Alarm Check" button to the main dashboard view above the tracked items columns.

## v2.7.3
- **Legacy Data Support**: Fixed category and due date mapping issues for existing users.
- **Date Parsing Fix**: Improved date parsing logic to prevent timezone shifts that caused due dates to calculate incorrectly.
- **Category Matching Fallback**: Added fuzzy matching for categories to support legacy records that used names instead of IDs.

## v2.7.2
- **Dynamic Categories**: Transitioned from hardcoded, static categories to a fully user-configurable category management system.
- **Category Iconography**: Added a wide set of icons using `lucide-react` for users to associate with their custom categories.
- **Category Colors**: Included an updated selection of color presets so users can uniquely style their categories.
- **Manage Categories Modal**: Implemented a new UI for creating, editing, and deleting categories, ensuring complete customization over tracked items.
- **Persistent Settings**: Configured categories are now saved within `localStorage` for guests and synced via Firebase Firestore for authenticated users under their user document.
- **Improved UI Selectors**: Updated category dropdowns in the Task tracking and Archive views to source dynamically from the user's custom categories.

## v2.7.1
- Initial React & Vite migration
- Secure environment variable usage (`import.meta.env`)
- Component-based structure with modern React Hooks
- Dual persistence layer (Cloud Sync + Local Storage)
