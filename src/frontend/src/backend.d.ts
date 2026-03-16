import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    timestamp: Time;
    phone: string;
}
export type Time = bigint;
export interface GalleryImage {
    url: string;
    caption: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGalleryImage(url: string, caption: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMenuItem(name: string, description: string, price: string, category: string): Promise<bigint>;
    deleteGalleryImage(url: string): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    getAllAvailableMenuItems(): Promise<Array<MenuItem>>;
    getAllContactMessages(): Promise<Array<ContactMessage>>;
    getAllGalleryImages(): Promise<Array<GalleryImage>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMenuItemsByCategory(category: string): Promise<Array<MenuItem>>;
    getStats(): Promise<[bigint, bigint, bigint]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initialize(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitContactMessage(name: string, phone: string, message: string): Promise<void>;
    toggleMenuItemAvailability(id: bigint): Promise<void>;
    updateMenuItem(id: bigint, name: string, description: string, price: string, category: string, isAvailable: boolean): Promise<void>;
}
