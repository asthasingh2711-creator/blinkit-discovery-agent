const LINKS = [
  { label: "Guided demo", href: "/demo" },
  { label: "Discovery IQ", href: "#discovery-iq" },
  { label: "GitHub", href: "#github" },
  { label: "Research appendix", href: "#research-appendix" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-blinkit-border px-4 py-5 text-center">
      <nav aria-label="Project links">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-blinkit-secondary">
          {LINKS.map((link, i) => (
            <li key={link.label} className="flex items-center gap-3">
              {i > 0 && (
                <span className="text-blinkit-border" aria-hidden>
                  ·
                </span>
              )}
              <a
                href={link.href}
                className="font-medium underline-offset-2 hover:text-blinkit-charcoal hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-2 text-[10px] text-blinkit-muted">
        Prototype · fictional demo basket · no personal data collected
      </p>
    </footer>
  );
}
