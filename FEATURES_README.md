# QuickVerse Admin — Features Documentation

> This document covers every feature currently implemented in the QuickVerse Admin mobile application. Intended as a reference for developers, product managers, or anyone onboarding to this codebase.

---

## Table of Contents

1. [App Launch & Force Update](#1-app-launch--force-update)
2. [Authentication](#2-authentication)
3. [Region / Campus Selection](#3-region--campus-selection)
4. [Dashboard — Order Overview](#4-dashboard--order-overview)
5. [Order Management by Status](#5-order-management-by-status)
6. [Vendor Cards (Collapsible)](#6-vendor-cards-collapsible)
7. [Order Summary Card](#7-order-summary-card)
8. [Order Details Modal](#8-order-details-modal)
9. [Push Notifications](#9-push-notifications)
10. [In-App Notification Modal](#10-in-app-notification-modal)
11. [Call Integration](#11-call-integration)
12. [Maps / Directions Integration](#12-maps--directions-integration)
13. [In-App WebView](#13-in-app-webview)
14. [Settings](#14-settings)
15. [Navigation Structure](#15-navigation-structure)
16. [State Management](#16-state-management)
17. [Persistent Storage](#17-persistent-storage)

---

## 1. App Launch & Force Update

**File:** `src/components/common/ForceUpdate.tsx`, `src/hooks/useFetchUpdateData.ts`

On every app launch, before any screen is shown, the app:

- Fetches remote app config (minimum required version, store URLs)
- Compares the device's installed app version (`DeviceInfo.getVersion()`) against `admin_min_required_version`
- If the installed version is **below** the minimum required:
  - Blocks access to the entire app
  - Displays an **"Update Required"** screen with branding
  - Provides an **"Update Now"** button that opens:
    - **Play Store** on Android
    - **App Store** on iOS
- If the fetch fails, shows a **retry** button
- Once version check passes, all children (the main app) are rendered normally

---

## 2. Authentication

**Files:** `src/screens/Login/loginScreen.tsx`, `src/screens/Login/OTPScreen.tsx`, `src/contexts/Login/AuthProvider.tsx`, `src/services/apis/authService.ts`

### Login Screen

- **Phone number input** with a `CountryPicker` modal supporting all countries
- Country flag, country code, and calling code auto-filled on country selection
- Defaults to **India (+91)**
- Numeric keyboard for phone input, max 10 digits
- **"Login"** button triggers OTP request to the backend
- Activity indicator shown while request is in progress
- Error alert shown on failure

### OTP Screen

- Displays the phone number the OTP was sent to
- **4-cell OTP input** using `react-native-confirmation-code-field`
  - Auto-blurs when all cells are filled
  - Clears focus cell on re-tap
- **60-second countdown timer** before "Resend Code" becomes active
- **Resend OTP** — re-sends OTP and resets the 60-second timer
- **"Change Number"** — navigates back to Login screen
- Activity indicator on verify and resend actions
- Validation: alerts if OTP is not 4 digits before submitting

### Session Management

- On successful OTP verification:
  - JWT token and phone number stored in **MMKV storage** under `@AuthData`
- On app re-launch:
  - Auth data loaded from MMKV — user skips login if session exists
- **Sign Out** clears MMKV storage and resets auth state

---

## 3. Region / Campus Selection

**Files:** `src/components/common/addressHeader.tsx`, `src/store/regions/useRegionsStore.ts`

- Displayed as a persistent header bar at the top of the Home screen
- Shows a **map-pin icon** and the currently selected region name
- Tapping opens a **searchable dropdown modal** with all available regions
- **Search bar** filters regions in real-time by `displayName` or `regionName`
- Selecting a region:
  - Updates the global Zustand regions store
  - Triggers order re-fetch for that region
  - Closes the modal
- Selected region is **persisted** across sessions via Zustand + MMKV
- If no region is selected, the Order Dashboard shows an **empty state** with instructions

---

## 4. Dashboard — Order Overview

**Files:** `src/components/Dashboard/OrderDashboard.tsx`, `src/components/Dashboard/DashboardTile.tsx`

The main home screen after login. Displays a summary of all orders grouped by status.

### Summary Tiles

Six color-coded clickable tiles show the live count of orders per status:

| Tile            | Status      | Color       |
| --------------- | ----------- | ----------- |
| Pending Orders  | `PENDING`   | Red tint    |
| Accepted Orders | `ACCEPTED`  | Green tint  |
| Ready To Ship   | `PACKED`    | Yellow tint |
| In Transit      | `SHIPPED`   | Yellow tint |
| Completed       | `COMPLETED` | Purple tint |
| Cancelled       | `CANCELLED` | Grey tint   |

- Each tile navigates to a **filtered order list** for that status on tap

### Time Filter Bar

Four filter buttons to scope the order data:

| Button       | Range                             |
| ------------ | --------------------------------- |
| Last Hour    | Past 60 minutes                   |
| Last 3 Hours | Past 3 hours                      |
| Today        | From midnight of current day      |
| This Month   | From the 1st of the current month |

- Active filter is visually highlighted
- Switching filter immediately re-fetches orders

### Auto Refresh

- Orders **automatically re-fetch every 3 minutes** in the background (180,000 ms interval)
- Interval resets when time filter changes

### Pull-to-Refresh

- Pull down on the scroll view to manually trigger a fresh order fetch

### States Handled

| State              | UI                                   |
| ------------------ | ------------------------------------ |
| Loading            | Full-screen `ActivityIndicator`      |
| Error              | Error message + **Retry** button     |
| No region selected | Illustration + instructional message |
| No orders          | Message + **Refresh** button         |
| Data loaded        | Summary tiles + scrollable content   |

---

## 5. Order Management by Status

**Files:** `src/screens/Dashboard/`, `src/store/orders/useOrdersStore.ts`

- Each status tile on the dashboard navigates to a dedicated order list screen for that status
- Orders are fetched by `regionId` and `startDate` (derived from time filter) via `/v2/order/OrderStatus`
- Store exposes helper selectors:
  - `getOrdersCountByStatus(status)` — total count per status
  - `getVendorOrdersByStatus(vendorId, status)` — orders for a specific vendor + status
  - `getVendorOrdersCountByStatus(vendorId, status)` — count per vendor per status
  - `getOrderById(orderId)` — single order lookup

### Order Status Flow

```
PENDING → ACCEPTED → PACKED → SHIPPED → COMPLETED
                                       ↘ CANCELLED / REJECTED
```

---

## 6. Vendor Cards (Collapsible)

**File:** `src/components/Dashboard/CollapsableVendor.tsx`

Within each status tab, orders are grouped under their respective vendor:

- Each **vendor card** shows:

  - Vendor logo (fetched from URL; fallback to `default_logo.png` if unavailable)
  - Vendor name (truncates to 2 lines)
  - Status icon (color-coded by current order status)
  - **Order count badge** — red circle with count overlaid on the logo (hidden when count is 0)
  - **Call button** — tapping dials the vendor's phone number directly via `tel:` URI
  - **Chevron icon** — indicates expand/collapse state

- Cards are **collapsed by default**
- Tapping the card header **toggles** expansion to show/hide the individual orders underneath

---

## 7. Order Summary Card

**File:** `src/components/Dashboard/OrderSummaryCard.tsx`

Each individual order is displayed as a card inside its vendor section:

| Field                       | Detail                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Order ID                    | Prefixed with `#`                                                                     |
| Creation Time               | Formatted as `HH:MM`                                                                  |
| Customer Name               | With account icon                                                                     |
| Status Badge                | Color-coded pill with status icon and label                                           |
| Time Elapsed Label          | Dynamic label based on status (e.g. "Pending Time", "Preparing Time", "Completed In") |
| Time Value                  | Elapsed time since status change, formatted contextually                              |
| Item Count                  | Total number of items in the order                                                    |
| **View Order** button       | Opens Order Details Modal                                                             |
| **Contact Customer** button | Initiates a phone call to the customer                                                |

### Time Display Logic per Status

| Status                   | Time Shown                           |
| ------------------------ | ------------------------------------ |
| `PENDING`                | Time elapsed since creation          |
| `ACCEPTED`               | Time elapsed since acceptance        |
| `PACKED`                 | `--`                                 |
| `SHIPPED`                | `--`                                 |
| `COMPLETED`              | Absolute IST timestamp of completion |
| `CANCELLED` / `REJECTED` | Absolute IST timestamp of rejection  |

---

## 8. Order Details Modal

**File:** `src/components/Dashboard/OrderDetailsModel.tsx`

A full-screen slide-up modal with complete order information:

### Sections

#### Header

- Order ID (`#orderId`)
- Order creation timestamp

#### Items List

- All ordered items with name and quantity (`X {count}`)
- **Total Item Count** shown in bold at the bottom

#### Customer Info

- Customer full name
- Tap-to-call phone button showing `+91 {mobile}`

#### Addresses

- **Pickup Address** (Vendor's shop address):

  - Street, city, state, postal code
  - **"Get Directions >"** button — opens native maps app at vendor coordinates

- **Drop Address** (Customer's delivery address):
  - Address Line 1, Address Line 2
  - City, state, pincode
  - **"Get Directions >"** button — opens native maps app at customer coordinates

#### Bill Summary

- Subtotal (amount excluding delivery fee)
- Delivery Fee
- Divider
- **Total Amount** (invoice amount)
- Payment Method

#### Order Timeline

- Accepted Date/Time
- Completed Date/Time (if applicable)
- Rejected/Cancelled Date/Time (if applicable)
- All timestamps converted from UTC to IST for display

---

## 9. Push Notifications

**Files:** `src/hooks/notification/useNotification.tsx`, `src/components/route/AppStack.tsx`, `index.js`

### Firebase Cloud Messaging (FCM)

- Full FCM integration via `@react-native-firebase/messaging`
- FCM token retrieved on app start and available for backend registration
- Handles all three app states:

| App State         | Handler                                 | Behavior                              |
| ----------------- | --------------------------------------- | ------------------------------------- |
| **Foreground**    | `messaging().onMessage()`               | Displays a local notifee notification |
| **Background**    | `messaging().onNotificationOpenedApp()` | Logs; does not re-display             |
| **Killed / Quit** | `messaging().getInitialNotification()`  | Logs; does not re-display             |

### Notifee Local Notifications

- Custom **Android notification channel** named `Default Channel`
- Priority: `HIGH`
- Custom notification sound: `noti` (mapped to `res/raw/noti.wav`)
- Handles both `notification` payload and **data-only** payloads
- Skips display if both title and body are empty (prevents blank notifications)

### Permission Handling

- **iOS**: Requests `messaging().requestPermission()` — supports `AUTHORIZED` and `PROVISIONAL`
- **Android 13+**: Requests `POST_NOTIFICATIONS` via `PermissionsAndroid`
- **Android < 13**: Permissions granted implicitly

---

## 10. In-App Notification Modal

**File:** `src/components/common/notificationModel.tsx`

- A custom in-app modal for displaying new order notifications while the app is in the foreground
- Shown over the current screen without disrupting navigation

---

## 11. Call Integration

**Files:** `OrderSummaryCard.tsx`, `CollapsableVendor.tsx`, `OrderDetailsModel.tsx`

Direct phone calling is available from multiple places using React Native's `Linking.openURL('tel:...')`:

| Entry Point                             | Calls                    |
| --------------------------------------- | ------------------------ |
| Order Summary Card → "Contact Customer" | Customer's mobile number |
| Order Details Modal → phone button      | Customer's mobile number |
| Vendor Card → call button (blue)        | Vendor's phone number    |

---

## 12. Maps / Directions Integration

**File:** `src/utils/orderUtils.ts`, `OrderDetailsModel.tsx`

- "Get Directions" buttons appear in the Order Details Modal for both pickup and drop addresses
- Opens the device's **native maps app** (Google Maps / Apple Maps) using a geo URI with:
  - Latitude and longitude coordinates
  - A label for the pin (e.g. customer's name + "Location")

---

## 13. In-App WebView

**File:** `src/screens/webview/WebView.tsx`

- Embedded browser using React Native WebView
- Used to open order-related links (`orderLink` field on an order) without leaving the app

---

## 14. Settings

**File:** `src/screens/Settings/SettingScreen.tsx`

- Accessible via the **Settings** tab in the bottom navigation
- Currently contains one action:

### Sign Out

- Tapping "Sign Out" triggers a confirmation `Alert` dialog:
  - **Cancel** — dismisses the dialog, stays logged in
  - **Sign Out** (destructive) — calls `auth.signOut()`:
    - Clears JWT and phone from MMKV storage
    - Resets auth state
    - Redirects to Login screen

---

## 15. Navigation Structure

**Files:** `src/navigation/`, `src/components/route/`

```
App
├── ForceUpdateChecker (wraps everything)
│   └── AuthProvider
│       ├── AuthStack (unauthenticated)
│       │   ├── LoginScreen
│       │   └── OTPScreen
│       └── AppStack (authenticated)
│           └── TabNavigation (Bottom Tabs)
│               ├── Home Tab
│               │   └── HomeScreen
│               │       └── DashboardNavigation (Stack)
│               │           ├── OrderList (Dashboard tiles)
│               │           └── VendorOrders (Orders by status)
│               └── Settings Tab
│                   └── SettingScreen
```

- Auth state drives route switching: authenticated users see `AppStack`, unauthenticated see `AuthStack`
- `headerShown: false` on all screens for a custom header via `RegionSelector`

---

## 16. State Management

**Library:** Zustand

| Store          | File                                     | Responsibility                                                  |
| -------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Orders Store   | `src/store/orders/useOrdersStore.ts`     | Fetch, cache, and query all orders with status/vendor selectors |
| Vendors Store  | `src/store/vendors/useVendorStore.ts`    | Vendor details keyed by shopId                                  |
| Regions Store  | `src/store/regions/useRegionsStore.ts`   | Available regions list + selected region                        |
| Campuses Store | `src/store/campuses/useCampusesStore.ts` | Campus-level data                                               |
| Auth Context   | `src/contexts/Login/AuthProvider.tsx`    | JWT token, phone, login/logout actions                          |

---

## 17. Persistent Storage

**Library:** MMKV (via `react-native-mmkv`)

**File:** `src/services/storage/MMKV/`

| Key         | Data Stored                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| `@AuthData` | JSON string of `{ jwt, phone }` — loaded on every app launch to restore session |

- Zustand stores for regions and campuses also persist selected state via MMKV
- On sign out, `storage.clearAll()` wipes all stored data

---

## Tech Stack Summary

| Category           | Technology                             |
| ------------------ | -------------------------------------- |
| Framework          | React Native (TypeScript)              |
| State Management   | Zustand                                |
| Storage            | MMKV                                   |
| Navigation         | React Navigation (Stack + Bottom Tabs) |
| Push Notifications | Firebase Messaging + Notifee           |
| HTTP Client        | Axios                                  |
| Maps               | Native Maps via `Linking` (geo URI)    |
| Icons              | MaterialCommunityIcons, Feather        |
| OTP Input          | react-native-confirmation-code-field   |
| Country Picker     | react-native-country-picker-modal      |
| Linear Gradient UI | react-native-linear-gradient           |
| Device Info        | react-native-device-info               |

---

_Last Updated: March 2026 — QuickVerse Admin_
