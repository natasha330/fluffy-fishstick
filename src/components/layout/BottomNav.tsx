import { Home, Eye, MessageCircle, ShoppingCart, User } from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Home", id: "home", path: "/" },
  { icon: Eye, label: "Explore", id: "explore", path: "/products" },
  { icon: MessageCircle, label: "Messages", id: "messages", path: "/messages" },
  { icon: ShoppingCart, label: "Cart", id: "cart", path: "/cart" },
  { icon: User, label: "My Alibaba", id: "account", path: "/buyer", authRequired: true },
] as const;

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const activeItem = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/cart')) return 'cart';
    if (path.startsWith('/buyer') || path.startsWith('/seller') || path.startsWith('/admin')) return 'account';
    if (path.startsWith('/products') || path.startsWith('/product')) return 'explore';
    return 'home';
  }, [location.pathname]);

  const handleNav = (id: (typeof navItems)[number]['id'], path: string, authRequired?: boolean) => {
    if (authRequired && !user) {
      navigate(`/auth?redirect=${encodeURIComponent(path)}`);
      return;
    }

    // Prefer Admin panel for admins when tapping the account icon
    if (id === 'account' && isAdmin) {
      navigate('/admin');
      return;
    }

    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map(({ icon: Icon, label, id, path, authRequired }) => (
          <button
            key={id}
            onClick={() => handleNav(id, path, authRequired)}
            className={`nav-item ${activeItem === id ? "nav-item-active" : ""}`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
