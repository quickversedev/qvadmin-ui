# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuickVerse Admin (`quickverseAdmin_ui`) is a React Native 0.79 + TypeScript mobile app for managing campus delivery operations. It serves as the admin/captain interface for order management, vendor oversight, delivery partner coordination, and push notifications across campus regions.

## Commands

```bash
# Start Metro bundler (port 8083)
npm start

# Run on Android (port 8083)
npm run android

# Run on iOS
npm run ios

# Lint
npm run lint

# Run tests
npm test

# Run a single test file
npx jest path/to/file.test.ts
```

The Android build uses a non-default Metro port (8083).

## Architecture

### Auth Flow

`AuthProvider` (React Context) manages JWT session state. JWT + phone are persisted in MMKV storage under `@AuthData`. On app launch, stored auth is loaded; if present, user skips login. The `Router` component (`src/components/route/Route.tsx`) switches between `AuthStack` (login/OTP) and `AppStack` (authenticated tabs) based on `authData.jwt`.

Session expiration is handled globally in the Axios interceptor (`axios.config.ts`) — error codes `1047`/`1042` trigger auto-logout via a registered callback.

### Navigation Structure

```
NavigationContainer
  └── ForceUpdateChecker (gates app on version check)
      ├── AuthStack: LoginScreen → OTPScreen
      └── AppStack: TabNavigation (Bottom Tabs)
            ├── Home → HomeScreenNavigation (Stack)
            │         ├── HomeScreen (OrderDashboard)
            │         └── VendorOrders
            └── Settings → SettingsNavigation (Stack)
                          ├── SettingsHome
                          ├── Transporters / AddTransporter
                          ├── Configurations
                          ├── PagesPromotionalBanners / AddPromotionBanner
                          └── BroadcastNotifications
```

All screens use `headerShown: false`; custom headers are rendered inline.

### State Management

Zustand stores (in `src/store/`) are the primary state layer. Several stores persist to MMKV via `zustand/middleware/persist` using a custom MMKV storage adapter at `src/services/storage/MMKV/zustandMmkvStorage`. Auth is the sole exception — it uses React Context (`src/contexts/Login/AuthProvider.tsx`).

Key stores: `useOrderStore`, `useVendorStore`, `useRegionsStore`, `useCampusesStore`, `useOrderMasterStore`, `useDeliveryPartnerStore`, `usePagesStore`, `useDevModeStore`.

### API Layer

All HTTP requests go through a shared Axios instance (`src/services/apis/axios.config.ts`):
- Base URL: `http://prd.quickverse.in`
- Auth header: `SessionKey: <jwt>` (not standard `Authorization: Bearer`)
- Request origin header: `Request-Origin: CAPTAIN`
- The `apiCall<T>()` wrapper handles error normalization and API logging
- Service files in `src/services/apis/` each own a domain (orders, auth, delivery partners, pricing, promotions, pages, notifications, etc.)

### Order Status Flow

```
PENDING → ACCEPTED → PACKED → SHIPPED → COMPLETED
                                       ↘ CANCELLED / REJECTED
```

Order statuses are defined in `src/assets/constants/constant.ts` as `ORDER_STATUS`.

### Fonts

Default font is `BricolageGrotesque-Regular`, applied globally via `Text.defaultProps` in `App.tsx`. Font constants are in `src/assets/constants/fonts.ts`. Also uses the `Outfit` family for emphasis.

### Push Notifications

Firebase Cloud Messaging + Notifee for local display. Custom sound (`noti`) on Android. Notification setup is in `src/hooks/notification/useNotification.tsx`, redirect logic in `src/services/notification/notificationRedirect.ts`.

### Dev Mode

Toggle via `useDevModeStore` (persisted). `DevModeBadge` component shows visual indicator. Dev mode surfaces a different base URL or debug info.
