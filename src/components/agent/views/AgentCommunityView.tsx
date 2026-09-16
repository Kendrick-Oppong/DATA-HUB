import React from "react";
import { MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import { SignalRail } from "../../common/SignalRail";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";

export const AgentCommunityView: React.FC = () => {
  const handleJoinWhatsApp = () => {
    // Open WhatsApp group link
    window.open("https://chat.whatsapp.com/placeholder", "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-500" />
            <span>Join the agent community</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect with thousands of Smart Data Hub agents. Get price alerts,
            selling tips, downtime notices and direct support.
          </p>
        </div>
        <SignalRail status="online" size="sm" label="Community Active" />
      </div>

      <Card className="border-border shadow-xs">
        <CardContent className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  WhatsApp Agents Group
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily price drops, tips and instant support from the team.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Real-time price alerts and bundle updates</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Selling tips and best practices from top agents</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Downtime notices and service updates</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Direct support from SDH team</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleJoinWhatsApp}
              className="w-full h-11 gap-2 font-bold"
              size="lg"
            >
              <ExternalLink className="w-4 h-4" />
              Join WhatsApp Group
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
