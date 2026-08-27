import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/get-session-profile";

const NAV_LINKS = [
  { href: "/workflows", label: "Workflows" },
  { href: "/qa", label: "Q&A" },
  { href: "/docs", label: "Docs" },
];

export async function PublicNavbar() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <GlobalSearch className="ml-2 hidden h-9 max-w-xs flex-1 justify-start gap-2 text-muted-foreground font-normal lg:flex" />
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch
            iconOnly
            className="flex h-9 w-9 items-center justify-center p-0 text-muted-foreground lg:hidden"
          />
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
