import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Landing } from "./pages/Landing";
import { FeedbackForm } from "./pages/FeedbackForm";
import { CustomerThread } from "./pages/CustomerThread";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Landing },
      { path: "feedback", Component: FeedbackForm },
      { path: "thread", Component: CustomerThread },
      { path: "dashboard", Component: OwnerDashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
