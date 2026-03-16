import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContactMessage, GalleryImage, MenuItem } from "../backend.d";
import { useActor } from "./useActor";

export type AdminRole = { mainAdmin: null } | { admin: null } | { staff: null };
export interface AccountInfo {
  id: bigint;
  email: string;
  role: AdminRole;
}
export interface SessionInfo {
  email: string;
  role: AdminRole;
}
export interface RestaurantInfo {
  phone: string;
  email: string;
  address: string;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isMainAdmin(role: AdminRole): boolean {
  return "mainAdmin" in role;
}
export function isAdminOrAbove(role: AdminRole): boolean {
  return "mainAdmin" in role || "admin" in role;
}
export function roleLabel(role: AdminRole): string {
  if ("mainAdmin" in role) return "Main Admin";
  if ("admin" in role) return "Admin";
  return "Staff";
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem("adminToken") ?? null;
}
export function setAdminToken(token: string): void {
  sessionStorage.setItem("adminToken", token);
}
export function clearAdminToken(): void {
  sessionStorage.removeItem("adminToken");
}

export function useAdminSetup() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["adminSetup"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isAdminSetup();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useValidateToken() {
  const { actor, isFetching } = useActor();
  const token = getAdminToken();
  return useQuery<SessionInfo | null>({
    queryKey: ["validateToken", token],
    queryFn: async () => {
      if (!actor || !token) return null;
      const result = await (actor as any).validateToken(token);
      if (Array.isArray(result)) {
        return result.length > 0 ? result[0] : null;
      }
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useMenuItems() {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAvailableMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllMenuItemsAdmin() {
  const { actor, isFetching } = useActor();
  const token = getAdminToken();
  return useQuery<MenuItem[]>({
    queryKey: ["allMenuItemsAdmin", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      return (actor as any).getAllMenuItems(token);
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useStats() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, bigint, bigint]>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor) return [0n, 0n, 0n] as [bigint, bigint, bigint];
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGalleryImages() {
  const { actor, isFetching } = useActor();
  return useQuery<GalleryImage[]>({
    queryKey: ["galleryImages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGalleryImages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useContactMessages() {
  const { actor, isFetching } = useActor();
  const token = getAdminToken();
  return useQuery<ContactMessage[]>({
    queryKey: ["contactMessages", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      return (actor as any).getAllContactMessages(token);
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useRestaurantInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<RestaurantInfo | null>({
    queryKey: ["restaurantInfo"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await (actor as any).getRestaurantInfo();
        if (Array.isArray(result)) return result.length > 0 ? result[0] : null;
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAccounts(session: SessionInfo | null | undefined) {
  const { actor, isFetching } = useActor();
  const token = getAdminToken();
  const enabled =
    !!actor && !isFetching && !!token && !!session && isMainAdmin(session.role);
  return useQuery<AccountInfo[]>({
    queryKey: ["accounts", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      return (actor as any).listAccounts(token);
    },
    enabled,
  });
}

export function useLogin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<string | null, Error, { email: string; password: string }>(
    {
      mutationFn: async ({ email, password }) => {
        if (!actor) throw new Error("Actor not ready");
        const hash = await hashPassword(password);
        const result = await (actor as any).login(email, hash);
        if (Array.isArray(result)) return result.length > 0 ? result[0] : null;
        return result ?? null;
      },
      onSuccess: (token) => {
        if (token) {
          setAdminToken(token);
          qc.invalidateQueries({ queryKey: ["validateToken"] });
        }
      },
    },
  );
}

export function useSetupMainAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      if (!actor) throw new Error("Actor not ready");
      const hash = await hashPassword(password);
      return (actor as any).setupMainAdmin(email, hash);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminSetup"] });
    },
  });
}

export function useLogout() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const token = getAdminToken();
      if (actor && token) {
        try {
          await (actor as any).logout(token);
        } catch {
          /* ignore */
        }
      }
      clearAdminToken();
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useCreateAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { email: string; password: string; role: "admin" | "staff" }
  >({
    mutationFn: async ({ email, password, role }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      const hash = await hashPassword(password);
      const roleCandid: AdminRole =
        role === "admin" ? { admin: null } : { staff: null };
      return (actor as any).createAccount(token, email, hash, roleCandid);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useRemoveAccount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, { targetEmail: string }>({
    mutationFn: async ({ targetEmail }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      return (actor as any).removeAccount(token, targetEmail);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useTransferMainAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<boolean, Error, { targetEmail: string }>({
    mutationFn: async ({ targetEmail }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      return (actor as any).transferMainAdmin(token, targetEmail);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["validateToken"] });
    },
  });
}

export function useChangePassword() {
  const { actor } = useActor();
  return useMutation<
    boolean,
    Error,
    { oldPassword: string; newPassword: string }
  >({
    mutationFn: async ({ oldPassword, newPassword }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      const [oldHash, newHash] = await Promise.all([
        hashPassword(oldPassword),
        hashPassword(newPassword),
      ]);
      return (actor as any).changePassword(token, oldHash, newHash);
    },
  });
}

export function useAdminResetPassword() {
  const { actor } = useActor();
  return useMutation<
    boolean,
    Error,
    { targetEmail: string; newPassword: string }
  >({
    mutationFn: async ({ targetEmail, newPassword }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      const newHash = await hashPassword(newPassword);
      return (actor as any).adminResetPassword(token, targetEmail, newHash);
    },
  });
}

export function useUpdateRestaurantInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { phone: string; email: string; address: string }
  >({
    mutationFn: async ({ phone, email, address }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      return (actor as any).updateRestaurantInfo(token, phone, email, address);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurantInfo"] });
    },
  });
}

export function useCreateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    bigint,
    Error,
    { name: string; description: string; price: string; category: string }
  >({
    mutationFn: async ({ name, description, price, category }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      return (actor as any).createMenuItem(
        token,
        name,
        description,
        price,
        category,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMenuItemsAdmin"] });
      qc.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    {
      id: bigint;
      name: string;
      description: string;
      price: string;
      category: string;
      isAvailable: boolean;
    }
  >({
    mutationFn: async ({
      id,
      name,
      description,
      price,
      category,
      isAvailable,
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      await (actor as any).updateMenuItem(
        token,
        id,
        name,
        description,
        price,
        category,
        isAvailable,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMenuItemsAdmin"] });
      qc.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, { id: bigint }>({
    mutationFn: async ({ id }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      await (actor as any).deleteMenuItem(token, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMenuItemsAdmin"] });
      qc.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useAddGalleryImage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, { url: string; caption: string }>({
    mutationFn: async ({ url, caption }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      await (actor as any).addGalleryImage(token, url, caption);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["galleryImages"] });
    },
  });
}

export function useDeleteGalleryImage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, { url: string }>({
    mutationFn: async ({ url }) => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      await (actor as any).deleteGalleryImage(token, url);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["galleryImages"] });
    },
  });
}

export function useInitializeMenu() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const token = getAdminToken();
      if (!token) throw new Error("Not authenticated");
      await (actor as any).initialize(token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMenuItemsAdmin"] });
      qc.invalidateQueries({ queryKey: ["menuItems"] });
    },
  });
}

export function useSubmitContactMessage() {
  const { actor } = useActor();
  return useMutation<
    void,
    Error,
    { name: string; phone: string; message: string }
  >({
    mutationFn: async ({ name, phone, message }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.submitContactMessage(name, phone, message);
    },
  });
}
