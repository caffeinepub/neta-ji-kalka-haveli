# Neta Ji (Kalka Haveli) Family Restaurant

## Current State
New project. User provided an HTML mockup for a restaurant website.

## Requested Changes (Diff)

### Add
- **Home page (`/`)**: Header with restaurant name, nav bar (Menu, Gallery, Contact), hero section with "Best Food on NH77", welcome section, footer
- **Menu page (`/menu`)**: Categorized food items (Veg & Non-Veg), item name + description + price
- **Admin page (`/admin`)**: Role-protected page for restaurant owner to add/edit/delete menu items and gallery photos
- **Panel page (`/panel`)**: Control panel showing stats: total menu items, categories, messages/inquiries
- **Gallery page (`/gallery`)**: Photo grid of restaurant / food images
- **Contact page (`/contact`)**: Contact form (name, phone, message) + address/location info

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Menu items CRUD, contact message storage, gallery image references, admin role check
2. Authorization component for admin-only access
3. Frontend: React app with React Router for all 6 pages
   - Brand color: deep maroon (#7a0000) as primary, black nav/footer
   - Hero with food background image
   - Menu grouped by category (Veg / Non-Veg / Drinks etc.)
   - Admin CRUD for menu items
   - Panel with summary stats
   - Contact form that saves messages to backend
