import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/workflows", label: "Workflow Marketplace" },
      { href: "/qa", label: "Q&A Forum" },
      { href: "/docs", label: "Documentation" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/workflows/new", label: "Publish a workflow" },
      { href: "/qa/ask", label: "Ask a question" },
      { href: "/docs#cli", label: "CLI reference" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/settings/api-keys", label: "API keys" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
          <Logo />
          <p className="max-w-[220px] text-sm text-muted-foreground">
            The community hub for Fusion AI automation workflows.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="category-label text-muted-foreground">{column.title}</p>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6">
        <p className="container text-xs text-muted-foreground">
          © {new Date().getFullYear()} Fusion AI Community Hub. Not affiliated with any third-party platforms referenced in workflow templates.
        </p>
      </div>
    </footer>
  );
}
