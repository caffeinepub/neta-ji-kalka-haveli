# Neta Ji Kalka Haveli - Restaurant Management System

## Current State
- App has `/admin-login`, `/staff-login`, `/dashboard` routes
- Backend has user auth with SHA-256 hashing, session tokens, mainAdmin flag
- First-time setup flow exists but login after setup is unreliable
- Admin dashboard has menu management and basic admin management
- Staff dashboard shows read-only menu view

## Requested Changes (Diff)

### Add
- Reliable first-time main admin setup: on first visit to `/admin-login`, show setup form; after `setupMainAdmin` succeeds, immediately call `login` and persist session token automatically
- Force password change flag: backend tracks `mustChangePassword`; after login if flag is true, show change-password form before dashboard
- Staff login at `/staff-login` that uses same backend `login` call, routes to `/staff-dashboard`
- Separate `/staff-dashboard` page: read-only menu and order view
- Admin management: create admin/staff (email + temp password), remove, reset password, transfer mainAdmin
- "Forgot password" message on both login pages: contact main admin
- All dashboard routes validate session token; redirect to login on failure
- Unauthorized login rejection with "Not authorized" message from backend

### Modify
- Backend `login` function: return `mustChangePassword` in response
- Backend `setupMainAdmin`: only succeeds once; subsequent calls return error
- Session token stored in localStorage; all protected calls send token in header or argument
- Admin login page: show first-time setup form if no main admin exists, login form otherwise
- Dashboard page: check role, show admin or staff view accordingly

### Remove
- Legacy `/admin` and `/panel` routes (keep redirects)
- Any Internet Identity remnants

## Implementation Plan
1. Rewrite `main.mo` with: User type (email, hashedPassword, role, mainAdmin, mustChangePassword), session map, `setupMainAdmin`, `login`, `logout`, `changePassword`, `resetPassword` (mainAdmin only), `createUser` (mainAdmin only), `removeUser` (mainAdmin only), `transferMainAdmin`, `getUsers`, menu CRUD functions
2. Rebuild `AdminLoginPage`: detect no-main-admin state via `isFirstTimeSetup()` call, show setup or login form; auto-login after setup; if `mustChangePassword` redirect to change-password screen
3. Rebuild `StaffLoginPage`: login form, on success route to `/staff-dashboard` or `/dashboard` based on role
4. Rebuild `DashboardPage`: role-aware, admin sees full management, staff sees read-only menu
5. Validate and deploy
