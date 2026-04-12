import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { SoundToggle } from "@/components/SoundToggle";
import { useAuth } from "@/contexts/AuthContext";
import { withAppUtm } from "@/lib/utm";
import { cn } from "@/lib/utils";

const CHESS_URL = import.meta.env.VITE_CHESS_APP_URL as string | undefined;
const HUB_URL = import.meta.env.VITE_HUB_URL as string | undefined;

export function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const playActive = pathname.startsWith("/play");

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 flex-wrap items-center justify-between gap-2 px-4">
        <Link to="/" className="font-serif text-lg font-semibold tracking-tight text-primary">
          Casual Games
        </Link>
        <div className="flex items-center gap-2">
          <SoundToggle />
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
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                playActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Jugar
              <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="z-50 min-w-[220px] rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-foreground shadow-xl backdrop-blur-md"
            >
              <DropdownMenuLabel className="px-2 py-1.5 text-xs font-normal text-muted-foreground">
                Elegí modo
              </DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to="/play" className="outline-none">
                  Vista amplia
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to="/play?variant=diagonal" className="outline-none">
                  Diagonal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to="/play/mini" className="outline-none">
                  Mini 6×6
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link to="/play/killer" className="outline-none">
                  Killer
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <NavLink
            to="/speed"
            className={({ isActive }) =>
              cn(
                "rounded-full px-3 py-1.5 transition-colors",
                isActive ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            Speed
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
      </div>
    </header>
  );
}
