import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Product = {
  id: string;
  name: string;
  description: string;
  points: number;
  stock: number;
  image: string;
  category: string;
};

export type Company = {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  cover: string;
  brandColor: string;
  category: string;
  email: string;
  website: string;
};

export type Session = { email: string } | null;

type Ctx = {
  session: Session;
  company: Company;
  products: Product[];
  login: (email: string) => void;
  logout: () => void;
  register: (email: string, companyName: string) => void;
  updateCompany: (patch: Partial<Company>) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
};

const defaultCompany: Company = {
  name: "",
  tagline: "",
  description: "",
  logo: "",
  cover: "",
  brandColor: "#2f7d4f",
  category: "",
  email: "",
  website: "",
};

const defaultProducts: Product[] = [];

const PortalCtx = createContext<Ctx | null>(null);
const KEY = "portal-aliados-v1";

type Persisted = { session: Session; company: Company; products: Product[] };

function load(): Persisted {
  if (typeof window === "undefined")
    return { session: null, company: defaultCompany, products: defaultProducts };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { session: null, company: defaultCompany, products: defaultProducts };
    return JSON.parse(raw);
  } catch {
    return { session: null, company: defaultCompany, products: defaultProducts };
  }
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => ({
    session: null,
    company: defaultCompany,
    products: defaultProducts,
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const ctx: Ctx = {
    session: state.session,
    company: state.company,
    products: state.products,
    login: (email) => setState((s) => ({ ...s, session: { email } })),
    logout: () => setState((s) => ({ ...s, session: null })),
    register: (email, companyName) =>
      setState((s) => ({
        ...s,
        session: { email },
        company: { ...s.company, name: companyName, email },
      })),
    updateCompany: (patch) => setState((s) => ({ ...s, company: { ...s.company, ...patch } })),
    addProduct: (p) =>
      setState((s) => ({
        ...s,
        products: [{ ...p, id: crypto.randomUUID() }, ...s.products],
      })),
    updateProduct: (id, patch) =>
      setState((s) => ({
        ...s,
        products: s.products.map((pr) => (pr.id === id ? { ...pr, ...patch } : pr)),
      })),
    removeProduct: (id) =>
      setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })),
  };

  return <PortalCtx.Provider value={ctx}>{children}</PortalCtx.Provider>;
}

export function usePortal() {
  const c = useContext(PortalCtx);
  if (!c) throw new Error("usePortal must be used within PortalProvider");
  return c;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
