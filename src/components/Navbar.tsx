import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useItems } from '@/context/ItemsContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Leaf, 
  Plus, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  BookOpen,
  Smartphone,
  ShoppingBag
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { donationRequests, exchangeRequests } = useItems();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Browse Items', icon: ShoppingBag },
    { href: '/requests', label: 'Requests', icon: Bell },
    { href: '/upload', label: 'Share Item', icon: Plus },
  ];

  const pendingIncoming = user
    ? donationRequests.filter((r) => (r.ownerId === user.id || (r.ownerEmail && user.email && r.ownerEmail.toLowerCase() === user.email.toLowerCase())) && r.status === 'pending').length +
      exchangeRequests.filter((r) => (r.ownerId === user.id || (r.ownerEmail && user.email && r.ownerEmail.toLowerCase() === user.email.toLowerCase())) && r.status === 'pending').length
    : 0;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">
            Shelf Share
          </span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    isActive(link.href) && "bg-primary/10 text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.href === '/requests' && pendingIncoming > 0 ? (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                      {pendingIncoming}
                    </span>
                  ) : null}
                </Button>
              </Link>
            ))}
          </nav>
        )}

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 animate-slide-up">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={isActive(link.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive(link.href) && "bg-primary/10 text-primary"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {link.href === '/requests' && pendingIncoming > 0 ? (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                      {pendingIncoming}
                    </span>
                  ) : null}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
