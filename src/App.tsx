import { Routes, Route } from "react-router-dom";
import Landing from "@/pages/Landing";
import Play from "@/pages/Play";
import PlayKiller from "@/pages/PlayKiller";

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/play" element={<Play />} />
      <Route path="/play/killer" element={<PlayKiller />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
