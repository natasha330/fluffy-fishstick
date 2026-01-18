import { Grid3X3, Target, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

const actions = [
  {
    icon: Grid3X3,
    label: "Source by category",
    color: "bg-primary/10 text-primary",
    path: "/products",
  },
  {
    icon: Target,
    label: "Request for Quotation",
    color: "bg-destructive/10 text-destructive",
    path: "/buyer/rfq/new",
  },
  {
    icon: Globe,
    label: "Europe",
    badge: "Open",
    color: "bg-accent text-accent-foreground",
    path: "/products?region=europe",
  },
];

export const ActionCards = () => {
  const navigate = useNavigate();
  const { content } = useSiteContent();

  if (!content.actionCards?.enabled) return null;

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {actions.map((action, index) => (
          <div 
            key={index} 
            className="action-card shrink-0 min-w-[140px] cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-2">{action.label}</p>
              {action.badge && (
                <span className="text-xs text-primary font-medium">{action.badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
