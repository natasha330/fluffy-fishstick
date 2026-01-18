import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Star, Flame } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: number;
  moq?: number;
  supplier?: string;
  isVerified?: boolean;
  isFlashDeal?: boolean;
  slug?: string;
  rating?: number;
  orders?: number;
  currency?: string;
  dealId?: string;
}

export const ProductCard = ({
  image,
  title,
  price,
  originalPrice,
  discount,
  moq,
  supplier,
  isVerified = false,
  isFlashDeal = false,
  slug,
  rating,
  orders,
  currency = "USD",
  dealId,
}: ProductCardProps) => {
  const CardContent = () => (
    <>
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-muted rounded-lg">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>
        {isFlashDeal && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground gap-1">
            <Flame className="w-3 h-3" />
            Flash Deal
          </Badge>
        )}
        {discount && discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
            -{discount}%
          </Badge>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">${originalPrice}</span>
          )}
        </div>
        
        {moq && (
          <p className="text-xs text-muted-foreground">
            Min. order: <span className="font-medium text-foreground">{moq} {moq === 1 ? 'piece' : 'pieces'}</span>
          </p>
        )}
        
        {(rating || orders) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {rating}
              </span>
            )}
            {orders && <span>{orders.toLocaleString()}+ sold</span>}
          </div>
        )}
        
        {supplier && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
            <span className="truncate">{supplier}</span>
          </div>
        )}
      </div>
    </>
  );

  // Link to product insights with deal ID
  if (dealId) {
    return (
      <Link to={`/product-insights/deal/${dealId}`} className="product-card group cursor-pointer">
        <CardContent />
      </Link>
    );
  }

  if (slug) {
    return (
      <Link to={`/product/${slug}`} className="product-card group cursor-pointer">
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="product-card group cursor-pointer">
      <CardContent />
    </div>
  );
};
