import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  resolveNetworkFromPathname,
  type NetworkProfile,
} from "../data/networks";

const NetworkContext = createContext<NetworkProfile | null>(null);

export function NetworkProvider({
  network,
  children,
}: {
  network?: NetworkProfile;
  children: ReactNode;
}) {
  const resolved = network ?? resolveNetworkFromPathname();

  useEffect(() => {
    document.title = resolved.pageTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", resolved.pageDescription);
    }
    document.documentElement.dataset.network = resolved.id;
  }, [resolved]);

  return (
    <NetworkContext.Provider value={resolved}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkProfile {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error("useNetwork must be used within NetworkProvider");
  }
  return ctx;
}
