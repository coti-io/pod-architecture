import type { ReactNode } from "react";
import { useNetwork } from "../network/NetworkContext";

type NavItem = {
  href: string;
  label: string;
  title: string;
  external?: boolean;
  icon: ReactNode;
};

function DocsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path
        d="M7 3.75h7.5L19 8.25v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
      <path d="M14.5 3.75V8.5H19M9 12.5h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

function ExplorerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" />
      <path d="m16.2 16.2 3.3 3.3" strokeLinecap="round" />
      <path d="M8.5 11h5M11 8.5v5" strokeLinecap="round" />
    </svg>
  );
}

function DemoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3.75" y="6.5" width="16.5" height="11" rx="2" />
      <path d="M3.75 10.25h16.5M8 14.5h3" strokeLinecap="round" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function AvalancheIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.9 4.4c-.35-.6-1.45-.6-1.8 0L3.7 18.2c-.36.62.1 1.4.9 1.4h3.2c.45 0 .86-.24 1.08-.63l3.12-5.4 3.12 5.4c.22.39.63.63 1.08.63h3.2c.8 0 1.26-.78.9-1.4L12.9 4.4Zm-.9 5.5L14.7 15H9.3L12 9.9Z" />
    </svg>
  );
}

function EthereumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2 5.8 12.2 12 15.7l6.2-3.5L12 2.2Zm0 15.2-6.1-3.5L12 21.8l6.1-7.9-6.1 3.5Z" />
    </svg>
  );
}

export default function SiteNav() {
  const network = useNetwork();

  const items: NavItem[] = [
    {
      href: network.docsHref,
      label: "Docs",
      title: network.docsLabel,
      external: true,
      icon: <DocsIcon />,
    },
    {
      href: network.explorerHref,
      label: "Explorer",
      title: network.explorerLabel,
      external: true,
      icon: <ExplorerIcon />,
    },
  ];

  if (network.demoHref) {
    items.push({
      href: network.demoHref,
      label: network.demoLabel ?? "Demo",
      title: network.demoLabel ?? "Live demo",
      external: true,
      icon: <DemoIcon />,
    });
  }

  if (network.exampleRepoHref) {
    items.push({
      href: network.exampleRepoHref,
      label: "Example",
      title: network.exampleRepoLabel ?? "Example repository",
      external: true,
      icon: <GithubIcon />,
    });
  }

  if (network.alternate) {
    const isAvalanche = /avalanche|fuji/i.test(network.alternate.label);
    items.push({
      href: network.alternate.href,
      label: isAvalanche ? "Avalanche" : network.alternate.label,
      title: network.alternate.label,
      external: /^https?:\/\//i.test(network.alternate.href),
      icon: isAvalanche ? <AvalancheIcon /> : <EthereumIcon />,
    });
  }

  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="https://pod.coti.io/" title="How PoD works">
        <img className="site-nav__mark" src="/favicon.svg" alt="" />
        <span>PoD</span>
      </a>
      <nav className="site-nav__links" aria-label="Site">
        {items.map((item) => (
          <a
            key={`${item.label}-${item.href}`}
            className="site-nav__link"
            href={item.href}
            title={item.title}
            {...(item.external
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            <span className="site-nav__icon">{item.icon}</span>
            <span className="site-nav__label">{item.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
