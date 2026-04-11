import { Routes, Route } from "react-router-dom";
import { useLoginSync } from "@/hooks/useLoginSync";
import Daily from "@/pages/Daily";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Play from "@/pages/Play";
import PlayKiller from "@/pages/PlayKiller";
import Profile from "@/pages/Profile";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-2">
        <p className="font-serif text-6xl text-primary">404</p>
        <p className="text-muted-foreground">Página no encontrada</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  useLoginSync();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/play" element={<Play />} />
      <Route path="/play/killer" element={<PlayKiller />} />
      <Route path="/daily" element={<Daily />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
