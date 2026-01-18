import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Truck,
  Headphones
} from "lucide-react";

const footerLinks = {
  getToKnow: {
    title: "Get to Know Us",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press Center", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  trade: {
    title: "Trade Services",
    links: [
      { label: "Trade Assurance", href: "/trade-assurance" },
      { label: "Buyer Protection", href: "/buyer-protection" },
      { label: "Logistics Services", href: "/logistics" },
      { label: "RFQ Marketplace", href: "/buyer/rfqs" },
    ],
  },
  sellOnSite: {
    title: "Sell on Site",
    links: [
      { label: "Start Selling", href: "/seller" },
      { label: "Seller Central", href: "/seller" },
      { label: "Become a Supplier", href: "/auth?role=seller" },
      { label: "Supplier Membership", href: "/membership" },
    ],
  },
  buyOnSite: {
    title: "Buy on Site",
    links: [
      { label: "Request for Quotation", href: "/buyer/rfqs/new" },
      { label: "Buyer Central", href: "/buyer" },
      { label: "Order Tracking", href: "/orders" },
      { label: "Payment Methods", href: "/payment-methods" },
    ],
  },
  help: {
    title: "Help & Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Report Abuse", href: "/report" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
};

const trustBadges = [
  { icon: Shield, label: "Buyer Protection" },
  { icon: Truck, label: "Fast Shipping" },
  { icon: CreditCard, label: "Secure Payments" },
  { icon: Headphones, label: "24/7 Support" },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-8">
      {/* Trust Badges */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Logo & Contact */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src={logo} alt="Logo" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              The leading B2B ecommerce platform connecting buyers and suppliers worldwide.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (800) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Global Headquarters</span>
              </div>
            </div>
          </div>

          {/* Footer Link Sections */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Copyright & Legal */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span>© {new Date().getFullYear()} B2B Marketplace. All rights reserved.</span>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
            </div>

            {/* Language & Currency */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>🌐 English</span>
              <span>|</span>
              <span>USD ($)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
