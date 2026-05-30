import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortal } from "@/lib/portal-store";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout, Field } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Crear cuenta — Portal de Aliados" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = usePortal();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !email || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    register(email, companyName);
    toast.success("¡Cuenta creada! Personaliza tu perfil ahora.");
    navigate({ to: "/dashboard/profile" });
  };

  return (
    <AuthLayout
      title="Crea tu cuenta de aliado"
      subtitle="En menos de un minuto estarás listo para publicar tu primer producto."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre de la empresa">
          <Input
            placeholder="Mi Empresa S.A."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Field>
        <Field label="Correo corporativo">
          <Input
            type="email"
            placeholder="hola@miempresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Contraseña">
          <Input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Crear cuenta
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
