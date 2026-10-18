import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/responsive";

interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface MobileNavProps {
  links: NavLink[];
  logo?: React.ReactNode;
  onNavigate?: (href: string) => void;
}

export function MobileNav({ links, logo, onNavigate }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    onNavigate?.(href);
    window.location.href = href;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border md:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">{logo}</div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background">
          <nav className="flex flex-col">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavigate(link.href)}
                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
              >
                {link.icon && <span className="text-muted-foreground">{link.icon}</span>}
                <span className="text-sm font-medium">{link.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
