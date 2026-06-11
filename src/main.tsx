import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// dev 전용: E2E 검증용 supabase 클라이언트 노출(프로덕션 빌드에서 트리셰이킹 제거).
if (import.meta.env.DEV) {
  import("./lib/supabase-client.js").then((m) => {
    (window as unknown as { __sb: unknown }).__sb = m.getSupabase();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
