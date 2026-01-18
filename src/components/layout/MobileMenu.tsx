import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  ChevronRight, 
  ChevronDown,
  Home,
  Package,
  ShoppingCart,
  MessageCircle,
  User,
  Settings,
  LogOut,
  FileText,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background z-50 md:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img src={logo} alt="Logo" className="h-8" />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Section */}
        <div className="p-4 border-b border-border bg-muted/50">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{user.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => handleNavigation('/auth')}
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleNavigation('/auth?mode=signup')}
              >
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Quick Links */}
            <nav className="space-y-1">
              <button 
                onClick={() => handleNavigation('/')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button 
                onClick={() => handleNavigation('/products')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>All Products</span>
              </button>
              <button 
                onClick={() => handleNavigation('/cart')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
              </button>
              <button 
                onClick={() => handleNavigation('/messages')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Messages</span>
              </button>
              <button 
                onClick={() => handleNavigation('/orders')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span>My Orders</span>
              </button>
            </nav>

            <Separator className="my-4" />

            {/* Categories */}
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {parentCategories.slice(0, 12).map((category) => {
                const subcategories = getSubcategories(category.id);
                const isExpanded = expandedCategories.includes(category.id);
                
                return (
                  <div key={category.id}>
                    <button
                      onClick={() => subcategories.length > 0 
                        ? toggleCategory(category.id)
                        : handleNavigation(`/products?category=${encodeURIComponent(category.slug)}`)
                      }
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{category.name}</span>
                      {subcategories.length > 0 && (
                        isExpanded 
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isExpanded && subcategories.length > 0 && (
                      <div className="ml-4 border-l border-border pl-2 space-y-1">
                        {subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleNavigation(`/products?category=${encodeURIComponent(sub.slug)}`)}
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {user && (
              <>
                <Separator className="my-4" />
                
                {/* Account Links */}
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                  Account
                </h3>
                <nav className="space-y-1">
                  {isAdmin && (
                    <button 
                      onClick={() => handleNavigation('/admin')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}
                  <button 
                    onClick={() => handleNavigation('/buyer')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>Buyer Dashboard</span>
                  </button>
                  <button 
                    onClick={() => handleNavigation('/seller')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Seller Dashboard</span>
                  </button>
                  <button 
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-destructive transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </nav>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};
