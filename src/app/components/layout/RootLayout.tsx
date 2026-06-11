import { Outlet } from "react-router";
import { StatusBar } from "../terminal/StatusBar";
import { GrainOverlay } from "../terminal/GrainOverlay";
import { Toaster } from "../ui/sonner";

export function RootLayout() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <GrainOverlay />
      <div className="sticky top-0 z-50">
        <StatusBar />
      </div>
      <Outlet />
      <Toaster position="bottom-center" />
    </div>
  );
}
