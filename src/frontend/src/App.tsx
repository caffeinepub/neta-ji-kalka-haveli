import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import AdminLoginPage from "./pages/AdminLoginPage";
import ContactPage from "./pages/ContactPage";
import DashboardPage from "./pages/DashboardPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import StaffLoginPage from "./pages/StaffLoginPage";

// Root with public layout
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// Public pages with layout
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: HomePage,
});
const menuRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/menu",
  component: MenuPage,
});
const galleryRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/gallery",
  component: GalleryPage,
});
const contactRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/contact",
  component: ContactPage,
});

// Auth & dashboard (no shared layout)
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-login",
  component: AdminLoginPage,
});
const staffLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/staff-login",
  component: StaffLoginPage,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => {
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      throw redirect({ to: "/admin-login" });
    }
  },
  component: DashboardPage,
});

// Legacy redirects
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLoginPage,
});
const panelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/panel",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: DashboardPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([indexRoute, menuRoute, galleryRoute, contactRoute]),
  adminLoginRoute,
  staffLoginRoute,
  dashboardRoute,
  adminRoute,
  panelRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
