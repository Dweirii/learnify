# 📁 Learnify App - Folder Structure Guide

This document explains the complete folder structure of your Learnify streaming application and what each directory is used for.

## 🏗️ **Overall Architecture**

Your app follows a **feature-based architecture** that's scalable, maintainable, and ready for tRPC integration. The structure separates concerns by functionality rather than file types.

---

## 📂 **Root Directory Structure**

```
learnify-app/
├── src/                    # Source code
├── public/                 # Static assets
├── prisma/                 # Database schema
├── package.json           # Dependencies & scripts
└── README.md              # Project documentation
```

---

## 🎯 **Source Code (`src/`)**

### **Core Application Structure**

```
src/
├── app/                   # Next.js App Router pages
├── components/            # Reusable UI components
├── features/              # Feature-based modules
├── server/                # Backend logic
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── store/                 # State management
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

---

## 📱 **App Directory (`src/app/`)**

Contains all your Next.js pages and layouts using the App Router pattern.

### **Route Groups**
- **`(auth)/`** - Authentication pages (sign-in, sign-up)
- **`(browse)/`** - Public browsing pages (home, search, user profiles)
- **`(dashboard)/`** - Protected dashboard pages (creator tools)

### **Key Pages**
- **`/`** - Home page with stream feed
- **`/[username]`** - Public user profile pages
- **`/search`** - Search results page
- **`/u/[username]`** - Creator dashboard
- **`/u/[username]/keys`** - Stream keys management
- **`/u/[username]/chat`** - Chat settings
- **`/u/[username]/community`** - Community management

### **API Routes**
- **`api/uploadthing/`** - File upload handling
- **`api/webhooks/`** - External service webhooks (Clerk, LiveKit)

---

## 🧩 **Components Directory (`src/components/`)**

### **UI Components (`ui/`)**
Contains shadcn/ui components - pre-built, accessible UI elements:
- `button.tsx`, `input.tsx`, `dialog.tsx`, etc.
- These are reusable across the entire application

### **Shared Components (`shared/`)**
Global components used throughout the app:
- **`user-avatar.tsx`** - User profile pictures with live indicators
- **`thumbnail.tsx`** - Stream thumbnails with live badges
- **`verified-mark.tsx`** - Verification badge component
- **`live-badge.tsx`** - "LIVE" indicator badge
- **`hint.tsx`** - Tooltip helper component

---

## 🎨 **Features Directory (`src/features/`)**

This is the heart of your feature-based architecture. Each feature is self-contained with its own components, logic, and types.

### **Authentication (`auth/`)**
- **`components/logo.tsx`** - App logo used in auth pages

### **Layout (`layout/`)**
Layout components for different sections of your app:

#### **Browse Layout**
- **`browse-container.tsx`** - Main container for browse pages
- **`browse-navbar/`** - Navigation bar for public pages
  - `index.tsx` - Main navbar component
  - `actions.tsx` - User actions (sign-in, profile dropdown)
  - `logo.tsx` - Logo with sidebar toggle
  - `search.tsx` - Search functionality
- **`browse-sidebar/`** - Sidebar for browse pages
  - `index.tsx` - Main sidebar component
  - `following.tsx` - Following users list
  - `recommended.tsx` - Recommended users
  - `toggle.tsx` - Sidebar collapse toggle
  - `user-item.tsx` - Individual user items

#### **Dashboard Layout**
- **`dashboard-container.tsx`** - Main container for dashboard pages
- **`dashboard-navbar/`** - Navigation for creator dashboard
- **`dashboard-sidebar/`** - Sidebar for creator dashboard

### **Stream (`stream/`)**
All streaming-related functionality:

#### **Stream Player**
- **`stream-player/`** - Complete streaming interface
  - `index.tsx` - Main stream player component
  - `video.tsx` - Video player component
  - `header.tsx` - Stream header with user info
  - `actions.tsx` - Follow/unfollow actions
  - `about-card.tsx` - User bio and stats
  - `info-card.tsx` - Stream information
  - `info-modal.tsx` - Stream settings modal
  - `bio-modal.tsx` - Bio editing modal
  - `community-item.tsx` - Community member item
  - `volume-control.tsx` - Audio controls
  - `fullscreen-control.tsx` - Fullscreen toggle
  - `variant-toggle.tsx` - Chat variant toggle

#### **Stream Management**
- **`stream-card.tsx`** - Unified component for displaying streams (grid/list variants)
- **`home-results.tsx`** - Home page stream results
- **`search-results.tsx`** - Search page stream results
- **`connect-modal.tsx`** - Stream connection modal
- **`copy-button.tsx`** - Copy stream key button
- **`key-card.tsx`** - Display stream key
- **`url-card.tsx`** - Display stream URL

### **Chat (`chat/`)**
All chat-related functionality:
- **`chat.tsx`** - Main chat component
- **`chat-form.tsx`** - Message input form
- **`chat-header.tsx`** - Chat header with controls
- **`chat-list.tsx`** - Message list display
- **`chat-message.tsx`** - Individual message component
- **`chat-toggle.tsx`** - Chat sidebar toggle
- **`chat-info.tsx`** - Chat information display
- **`chat-community.tsx`** - Community chat view
- **`toggle-card.tsx`** - Chat settings toggle cards

### **User (`user/`)**
User-related functionality:
- **`actions.tsx`** - User actions (follow, block, etc.)
- **`community/`** - Community management
  - `columns.tsx` - Data table columns for blocked users
  - `data-table.tsx` - Blocked users data table
  - `unblock-button.tsx` - Unblock user functionality

---

## ⚙️ **Server Directory (`src/server/`)**

Backend logic separated from frontend components:

### **Actions (`actions/`)**
Server actions for data mutations:
- **`auth.ts`** - Authentication actions
- **`user.ts`** - User management actions
- **`stream.ts`** - Stream management actions
- **`follow.ts`** - Follow/unfollow actions
- **`block.ts`** - Block/unblock actions
- **`ingress.ts`** - LiveKit ingress management
- **`token.ts`** - Token generation for LiveKit

### **Services (`services/`)**
Business logic and data access:
- **`auth.service.ts`** - Authentication logic
- **`user.service.ts`** - User data operations
- **`stream.service.ts`** - Stream data operations
- **`follow.service.ts`** - Follow relationship logic
- **`block.service.ts`** - Block relationship logic
- **`feed.service.ts`** - Home feed logic
- **`search.service.ts`** - Search functionality
- **`recommended.service.ts`** - User recommendations

---

## 🔧 **Supporting Directories**

### **Hooks (`src/hooks/`)**
Custom React hooks:
- **`use-viewer-token.ts`** - LiveKit viewer token management

### **Lib (`src/lib/`)**
Utility functions and configurations:
- **`utils.ts`** - General utility functions
- **`db.ts`** - Database connection
- **`uploadthing.ts`** - File upload configuration

### **Store (`src/store/`)**
State management:
- **`use-sidebar.ts`** - Sidebar state
- **`use-chat-sidebar.ts`** - Chat sidebar state
- **`use-creator-sidebar.ts`** - Creator sidebar state

### **Types (`src/types/`)**
TypeScript type definitions:
- **`index.ts`** - Shared types for serialized data

---

## 🎯 **Key Benefits of This Structure**

### **1. Feature-Based Organization**
- Each feature is self-contained
- Easy to find related functionality
- Clear separation of concerns

### **2. Scalability**
- Easy to add new features
- No conflicts between features
- Ready for team collaboration

### **3. tRPC Ready**
- Features map directly to tRPC routers
- Clean API boundaries
- Type-safe data flow

### **4. Maintainability**
- Clear component ownership
- Reduced coupling between features
- Easy to refactor individual features

### **5. Developer Experience**
- Intuitive file locations
- Consistent naming conventions
- Clear import paths

---

## 🚀 **Next Steps**

This structure is ready for:
- **tRPC Integration** - Each feature can have its own router
- **Team Scaling** - Multiple developers can work on different features
- **Feature Expansion** - Easy to add new streaming features
- **Testing** - Each feature can be tested independently

---

## 📝 **Naming Conventions**

- **Components**: PascalCase (`UserAvatar.tsx`)
- **Files**: kebab-case for multi-word (`browse-navbar/`)
- **Directories**: kebab-case (`user-management/`)
- **Features**: singular nouns (`stream/`, `chat/`, `user/`)

This structure provides a solid foundation for your Learnify streaming application! 🎉
