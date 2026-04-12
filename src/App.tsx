import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SkipToContent } from "@/components/SkipToContent";
import { useLoginSync } from "@/hooks/useLoginSync";

const Landing = lazy(() => import("@/pages/Landing"));
const Play = lazy(() => import("@/pages/Play"));
const PlayKiller = lazy(() => import("@/pages/PlayKiller"));
const Daily = lazy(() => import("@/pages/Daily"));
const Login = lazy(() => import("@/pages/Login"));
const Profile = lazy(() => import("@/pages/Profile"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <p>Cargando…</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="space-y-2 text-center">
        <p className="font-serif text-6xl text-primary">404</p>
        <p className="text-muted-foreground">Página no encontrada</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  useLoginSync();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play" element={<Play />} />
        <Route path="/play/killer" element={<PlayKiller />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <SkipToContent />
      <OfflineBanner />
      <div id="main-content" tabIndex={-1} className="outline-none">
        <AppRoutes />
      </div>
    </>
  );
}
