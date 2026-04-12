import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const banner = (location.state as { message?: string } | null)?.message;
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success("Sesión iniciada");
        navigate("/profile");
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { emailRedirectTo: `${window.location.origin}/profile` },
        });
        if (error) throw error;
        toast.success("Revisá tu email para confirmar la cuenta");
        reset();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="glass-strong w-full max-w-md space-y-6 rounded-2xl border border-border p-8 shadow-xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">P004 · Casual Games</p>
          <h1 className="mt-2 font-serif text-3xl text-gradient-gold">Championship Sudoku</h1>
          <p className="mt-1 text-sm text-muted-foreground">Iniciá sesión para guardar progreso en la nube</p>
        </div>

        {banner && (
          <p className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-center text-sm text-foreground">
            {banner}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => void onGoogle()}
          className="glass w-full rounded-lg border border-border py-3 text-sm font-medium transition hover:border-primary/50"
        >
          Continuar con Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <div className="flex gap-2 rounded-lg bg-muted/30 p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium",
              tab === "signin" ? "bg-background text-foreground shadow" : "text-muted-foreground"
            )}
            onClick={() => setTab("signin")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium",
              tab === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground"
            )}
            onClick={() => setTab("signup")}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : tab === "signin" ? "Entrar" : "Registrarse"}
          </button>
        </form>

        <Link to="/" className="block text-center text-sm text-primary hover:underline">
          Volver a jugar
        </Link>
      </div>
    </div>
  );
}
