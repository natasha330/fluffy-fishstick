import { Search, Camera, ChevronDown, ShoppingCart, User, Package, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [activeTab, setActiveTab] = useState("Products");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .is('parent_id', null)
        .limit(8);
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        {/* Top Bar */}
        <div className="px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden shrink-0"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src={logo} alt="Logo" className="h-7 md:h-10 w-auto" />
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex search-bar flex-1 max-w-xl">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <Camera className="w-5 h-5" />
              </button>
              <Button size="icon" className="shrink-0 rounded-full w-9 h-9" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Cart Icon */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/cart')}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    variant="destructive"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>

              {/* Orders - Desktop */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hidden md:flex"
                onClick={() => navigate('/orders')}
              >
                <Package className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background border border-border z-50">
                    <DropdownMenuItem onClick={() => navigate('/buyer')}>
                      Buyer Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/seller')}>
                      Seller Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:inline-flex"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="mt-2 md:hidden">
            <div className="search-bar">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button size="icon" className="shrink-0 rounded-full w-8 h-8" onClick={handleSearch}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden md:block px-4 border-b border-border relative">
          <div className="flex gap-6">
            {["Products", "Manufacturers", "Worldwide"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Products") navigate('/products');
                }}
                className={`py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
            
            {/* All Categories with Mega Menu */}
            <button
              onMouseEnter={() => setShowMegaMenu(true)}
              className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              All Categories
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mega Menu */}
          <MegaMenu isOpen={showMegaMenu} onClose={() => setShowMegaMenu(false)} />
        </div>

        {/* Category Chips */}
        <div className="px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => {
                setActiveCategory("All");
                navigate('/products');
              }}
              className={`category-chip whitespace-nowrap ${activeCategory === "All" ? "category-chip-active" : ""}`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.slug);
                  navigate(`/products?category=${encodeURIComponent(category.slug)}`);
                }}
                className={`category-chip whitespace-nowrap ${
                  activeCategory === category.slug ? "category-chip-active" : ""
                }`}
              >
                {category.name}
              </button>
            ))}
            <button 
              className="category-chip flex items-center gap-1 whitespace-nowrap md:hidden" 
              onClick={() => setShowMobileMenu(true)}
            >
              More <ChevronDown className="w-4 h-4" />
            </button>
            <button 
              className="category-chip hidden md:flex items-center gap-1 whitespace-nowrap" 
              onMouseEnter={() => setShowMegaMenu(true)}
            >
              More <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
    </>
  );
};
