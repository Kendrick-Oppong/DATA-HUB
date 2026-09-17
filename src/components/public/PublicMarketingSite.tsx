import React, { useEffect, useState } from "react";
import {
  TelecomNetwork,
  DataBundle,
  Order,
  UserRole,
  AppTheme,
} from "../../types";
import { PublicHomeSection, PublicTabType } from "./sections/PublicHomeSection";
import { PublicServicesSection } from "./sections/PublicServicesSection";
import { PublicAgentSection } from "./sections/PublicAgentSection";
import { PublicTrackSection } from "./sections/PublicTrackSection";
import { PublicFaqSection } from "./sections/PublicFaqSection";
import { PublicAboutSection } from "./sections/PublicAboutSection";
import { PublicContactSection } from "./sections/PublicContactSection";
import { PublicFooter } from "./sections/PublicFooter";

export interface PublicMarketingSiteProps {
  bundles: DataBundle[];
  activeTab?: PublicTabType;
  onStartPurchase?: (bundleId: string, network: TelecomNetwork) => void;
  onOpenOrderTracker?: (refOrPhone: string) => void;
  onApplyAgent?: () => void;
  orders: Order[];
  onNavigate?: (role: UserRole, tab: string) => void;
  onNavigateToLegal?: (page: "terms" | "privacy") => void;
  onOpenReceipt?: (order: Order) => void;
  onOpenAuth?: (mode?: "signin" | "signup" | "demo") => void;
  onOpenSecurityPins?: () => void;
  theme?: AppTheme;
}

export const PublicMarketingSite: React.FC<PublicMarketingSiteProps> = ({
  bundles,
  activeTab: routeTab = "home",
  onStartPurchase,
  onApplyAgent,
  orders,
  onNavigate,
  onNavigateToLegal,
  theme = "light",
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TelecomNetwork>("MTN");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("mtn-5gb");
  const [activeTab, setActiveTab] = useState<PublicTabType>("home");
  const [searchTrackInput, setSearchTrackInput] = useState<string>("");
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Agent Calculator State
  const [calcDailyBundles, setCalcDailyBundles] = useState<number>(25);
  const [calcAvgMargin, setCalcAvgMargin] = useState<number>(3.5);

  // FAQ filter
  const [faqQuery, setFaqQuery] = useState("");

  // Contact Form State
  const [contactCategory, setContactCategory] = useState<string>(
    "order-delivery-issue",
  );
  const [contactMessage, setContactMessage] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [ticketRef] = useState<string>(
    () => `TKT-SDH-${Math.floor(1000 + Math.random() * 9000)}`,
  );

  useEffect(() => {
    setActiveTab(routeTab);
  }, [routeTab]);

  const navigatePublicTab = (tab: PublicTabType) => {
    if (onNavigate) {
      onNavigate("public", tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleApplyAgent = () => {
    if (onApplyAgent) {
      onApplyAgent();
    } else if (onNavigate) {
      onNavigate("agent", "my-store");
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    const cleaned = searchTrackInput.trim();
    const found = orders.find(
      (o) =>
        o.reference.toLowerCase() === cleaned.toLowerCase() ||
        o.recipientPhone.includes(cleaned),
    );
    setTrackedOrder(found || null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ============ HOME ============ */}
      {activeTab === "home" && (
        <PublicHomeSection
          selectedNetwork={selectedNetwork}
          selectedBundleId={selectedBundleId}
          onSelectNetwork={setSelectedNetwork}
          onSelectBundleId={setSelectedBundleId}
          bundles={bundles}
          onStartPurchase={onStartPurchase}
          onNavigatePublicTab={navigatePublicTab}
          onApplyAgent={handleApplyAgent}
        />
      )}

      {/* ============ SERVICES ============ */}
      {activeTab === "services" && (
        <PublicServicesSection
          selectedNetwork={selectedNetwork}
          selectedBundleId={selectedBundleId}
          onSelectNetwork={setSelectedNetwork}
          bundles={bundles}
          onStartPurchase={onStartPurchase}
          onNavigatePublicTab={navigatePublicTab}
        />
      )}

      {/* ============ AGENT ============ */}
      {activeTab === "agent" && (
        <PublicAgentSection
          calcDailyBundles={calcDailyBundles}
          setCalcDailyBundles={setCalcDailyBundles}
          calcAvgMargin={calcAvgMargin}
          setCalcAvgMargin={setCalcAvgMargin}
          onApplyAgent={handleApplyAgent}
          onNavigatePublicTab={navigatePublicTab}
        />
      )}

      {/* ============ TRACK ============ */}
      {activeTab === "track" && (
        <PublicTrackSection
          searchTrackInput={searchTrackInput}
          setSearchTrackInput={setSearchTrackInput}
          trackedOrder={trackedOrder}
          setTrackedOrder={setTrackedOrder}
          trackSearched={trackSearched}
          setTrackSearched={setTrackSearched}
          orders={orders}
          handleTrackSubmit={handleTrackSubmit}
        />
      )}

      {/* ============ FAQ ============ */}
      {activeTab === "faq" && (
        <PublicFaqSection
          faqQuery={faqQuery}
          setFaqQuery={setFaqQuery}
          onNavigatePublicTab={navigatePublicTab}
        />
      )}

      {/* ============ ABOUT ============ */}
      {activeTab === "about" && (
        <PublicAboutSection
          selectedBundleId={selectedBundleId}
          selectedNetwork={selectedNetwork}
          onStartPurchase={onStartPurchase}
          onApplyAgent={handleApplyAgent}
        />
      )}

      {/* ============ CONTACT ============ */}
      {activeTab === "contact" && (
        <PublicContactSection
          contactCategory={contactCategory}
          setContactCategory={setContactCategory}
          contactMessage={contactMessage}
          setContactMessage={setContactMessage}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          contactSubmitted={contactSubmitted}
          setContactSubmitted={setContactSubmitted}
          ticketRef={ticketRef}
          handleContactSubmit={handleContactSubmit}
          onNavigatePublicTab={navigatePublicTab}
        />
      )}

      {/* Footer */}
      <PublicFooter
        onStartPurchase={onStartPurchase}
        onNavigatePublicTab={navigatePublicTab}
        onNavigate={onNavigate}
        onNavigateToLegal={onNavigateToLegal}
        theme={theme}
      />
    </div>
  );
};
