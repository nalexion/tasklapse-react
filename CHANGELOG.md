# Changelog

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
