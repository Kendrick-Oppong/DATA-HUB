import React from "react";
import { TelecomNetwork, UserRole } from "../../../types";
import { Button } from "../../ui/button";
import { PublicTabType } from "./PublicHomeSection";

interface PublicFooterProps {
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onNavigatePublicTab: (tab: PublicTabType) => void;
  onNavigate?: (role: UserRole, tab: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onStartPurchase,
  onNavigatePublicTab,
  onNavigate,
}) => {
  const handleStartPurchase = (bundleId: string, network: TelecomNetwork) => {
    if (onStartPurchase) {
      onStartPurchase(bundleId, network);
    }
  };

  return (
    <footer className="mt-auto border-t border-border bg-card/60 py-10">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center">
                SDH
              </div>
              <span className="font-extrabold text-sm text-foreground">
                Smart Data Hub
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ghana's trusted consumer fintech and telecom resale
              infrastructure. Instant automated delivery on all networks.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Quick Services
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Button
                  variant="ghost"
                  onClick={() => handleStartPurchase("mtn-5gb", "MTN")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Buy MTN Data
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() =>
                    handleStartPurchase("telecel-10gb", "Telecel")
                  }
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Buy Telecel Data
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() => handleStartPurchase("at-5gb", "AirtelTigo")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Buy AT Big Time Data
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() =>
                    onNavigate
                      ? onNavigate("customer", "results-checker")
                      : handleStartPurchase("waec-wassce", "MTN")
                  }
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  WASSCE / BECE Checkers
                </Button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Company & Legal
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Button
                  variant="ghost"
                  onClick={() => onNavigatePublicTab("about")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  About Smart Data Hub
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() => onNavigatePublicTab("faq")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Frequently Asked Questions
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() => onNavigatePublicTab("track")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Order Status Tracker
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  onClick={() => onNavigatePublicTab("contact")}
                  className="h-auto justify-start p-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-primary"
                >
                  Terms of Service & SLA
                </Button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Accra NOC Desk
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Airport Residential Area, Accra, Ghana.
              <br />
              Support:{" "}
              <span className="font-mono text-foreground font-semibold">
                +233 24 419 2834
              </span>
              <br />
              Email:{" "}
              <span className="text-foreground">
                support@smartdatahub.com
              </span>
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
          <div>
            © 2026 Smart Data Hub Ghana. All rights reserved. Primary
            currency: GH₵.
          </div>
          <div className="flex items-center gap-4">
            <span>MTN MoMo</span>
            <span>Telecel Cash</span>
            <span>AT Money</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
