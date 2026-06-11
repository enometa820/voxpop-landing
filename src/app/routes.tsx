import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Landing } from "./pages/Landing";
import { CustomerEntry } from "./pages/CustomerEntry";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { Admin } from "./pages/Admin";
import { Story } from "./pages/Story";
import { Privacy } from "./pages/Privacy";
import { OwnerGuide } from "./pages/OwnerGuide";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Landing },
      { path: "s", Component: CustomerEntry },
      { path: "owner", Component: OwnerDashboard },
      { path: "admin", Component: Admin },
      { path: "story", Component: Story },
      { path: "privacy", Component: Privacy },
      { path: "owner-guide", Component: OwnerGuide },
      // 구 경로 호환 리다이렉트
      { path: "feedback", element: <Navigate to="/s" replace /> },
      { path: "thread", element: <Navigate to="/s" replace /> },
      { path: "dashboard", element: <Navigate to="/owner" replace /> },
      { path: "*", Component: NotFound },
    ],
  },
]);
