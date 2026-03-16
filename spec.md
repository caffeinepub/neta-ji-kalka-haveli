# Neta Ji Kalka Haveli - Minimal Core System

## Current State
Previous builds failed due to complexity. Starting fresh with a minimal, stable foundation.

## Requested Changes (Diff)

### Add
- `/admin-login` route: First-time main admin setup (if no admin exists), then email+password login
- `/staff-login` route: Email+password login for staff accounts created by admin
- `/dashboard` route: Protected; shows menu management (add/edit/delete items) and staff management (main admin only)
- Backend: user store with hashed passwords, session tokens, role-based access (mainAdmin, admin, staff)
- Default seed: main admin account (shashisingh6745@gmail.com / Shashi@1234, mustChangePassword=true)

### Modify
- Nothing (fresh minimal build)

### Remove
- All previous complex features not in scope

## Implementation Plan
1. Backend: users (id, email, hashedPassword, role, mustChangePassword), sessions, menuItems (id, name, description, price, category, available)
2. Backend APIs: login, logout, getSession, createStaff, removeUser, listUsers, addMenuItem, editMenuItem, deleteMenuItem, listMenuItems
3. Frontend: AdminLoginPage, StaffLoginPage, DashboardPage with MenuManagement tab and StaffManagement tab (main admin only)
4. Route guards: redirect unauthenticated users to appropriate login page
