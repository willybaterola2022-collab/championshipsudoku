import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { withAppUtm } from "@/lib/utm";
import { cn } from "@/lib/utils";

const CHESS_URL = import.meta.env.VITE_CHESS_APP_URL as string | undefined;
const HUB_URL = import.meta.env.VITE_HUB_URL as string | undefined;

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 flex-wrap items-center justify-between gap-2 px-4">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight text-primary">
          Casual Games
        </Link>
        <nav className="flex flex-wrap items-center gap-1 rounded-full border border-border/50 bg-muted/30 p-1 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "rounded-full px-3 py-1.5 transition-colors",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            Sudoku
          </NavLink>
          <NavLink
            to="/daily"
            className={({ isActive }) =>
              cn(
                "rounded-full px-3 py-1.5 transition-colors",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            Diario
          </NavLink>
          {HUB_URL ? (
            <a
              href={withAppUtm(HUB_URL, "nav")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Hub
            </a>
          ) : null}
          {CHESS_URL ? (
            <a
              href={withAppUtm(CHESS_URL, "nav")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Ajedrez
            </a>
          ) : (
            <span className="rounded-full px-3 py-1.5 text-muted-foreground/60">Ajedrez</span>
          )}
          {user ? (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              Perfil
            </NavLink>
          ) : (
            <Link
              to="/login"
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
