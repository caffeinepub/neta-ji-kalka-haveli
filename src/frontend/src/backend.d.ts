export interface MenuItem {
  id: bigint;
  name: string;
  isAvailable: boolean;
  description: string;
  category: string;
  price: string;
}

export interface ContactMessage {
  name: string;
  message: string;
  timestamp: bigint;
  phone: string;
}

export interface GalleryImage {
  url: string;
  caption: string;
}

export interface AccountInfo {
  id: bigint;
  email: string;
  role: AdminRole;
}

export interface SessionInfo {
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
}

export interface RestaurantInfo {
  phone: string;
  email: string;
  address: string;
}

export type AdminRole =
  | { mainAdmin: null }
  | { admin: null }
  | { staff: null };

export interface backendInterface {
  // Auth
  login(email: string, passwordHash: string): Promise<string | null>;
  validateToken(token: string): Promise<SessionInfo | null>;
  logout(token: string): Promise<void>;

  // Password
  changePassword(token: string, oldHash: string, newHash: string): Promise<boolean>;
  adminResetPassword(token: string, targetEmail: string, newHash: string): Promise<boolean>;

  // Account management (mainAdmin only)
  createAccount(token: string, email: string, passwordHash: string, role: AdminRole): Promise<boolean>;
  removeAccount(token: string, targetEmail: string): Promise<boolean>;
  transferMainAdmin(token: string, targetEmail: string): Promise<boolean>;
  listAccounts(token: string): Promise<Array<AccountInfo>>;

  // Restaurant info
  getRestaurantInfo(): Promise<RestaurantInfo>;
  updateRestaurantInfo(token: string, phone: string, email: string, address: string): Promise<boolean>;

  // Menu
  initializeMenu(token: string): Promise<void>;
  createMenuItem(token: string, name: string, description: string, price: string, category: string): Promise<bigint>;
  updateMenuItem(token: string, id: bigint, name: string, description: string, price: string, category: string, isAvailable: boolean): Promise<void>;
  deleteMenuItem(token: string, id: bigint): Promise<void>;
  getAllMenuItems(token: string): Promise<Array<MenuItem>>;
  getAllAvailableMenuItems(): Promise<Array<MenuItem>>;
  getMenuItemsByCategory(category: string): Promise<Array<MenuItem>>;

  // Gallery
  addGalleryImage(token: string, url: string, caption: string): Promise<void>;
  deleteGalleryImage(token: string, url: string): Promise<void>;
  getAllGalleryImages(): Promise<Array<GalleryImage>>;

  // Contact
  submitContactMessage(name: string, phone: string, message: string): Promise<void>;
  getAllContactMessages(token: string): Promise<Array<ContactMessage>>;

  // Stats
  getStats(): Promise<[bigint, bigint, bigint]>;
}
