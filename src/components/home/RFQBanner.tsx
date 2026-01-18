import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

export const RFQBanner = () => {
  const navigate = useNavigate();
  const { content } = useSiteContent();

  if (!content.rfqBanner?.enabled) return null;

  return (
    <section className="py-6 px-4">
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">
              {content.rfqBanner?.title || 'Post a Buying Request'}
            </h3>
            <p className="text-sm opacity-90 mb-4">
              {content.rfqBanner?.description || 'Tell us what you need and get quotes from verified suppliers'}
            </p>
            <Button 
              variant="secondary" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => navigate('/buyer/rfq/new')}
            >
              Get Quotes <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
