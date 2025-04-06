import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Strategies from "@/pages/strategies";
import StrategyEditor from "@/pages/strategy-editor";
import CreateStrategy from "@/pages/create-strategy";
import DeployedStrategies from "@/pages/deployed-strategies";
import DeployStrategy from "@/pages/deploy-strategy";
import StrategyRecommendations from "@/pages/strategy-recommendations";
import RiskManagement from "@/pages/risk-management";
import Charts from "@/pages/charts";
import Backtesting from "@/pages/backtesting";
import Reports from "@/pages/reports";
import BrokerSetup from "@/pages/broker-setup";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import Checkout from "@/pages/checkout";
// import Subscribe from "@/pages/subscribe";
import TestPage from "@/pages/test";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/strategies" component={Strategies} />
      <Route path="/strategies/editor/:id?" component={StrategyEditor} />
      <Route path="/strategies/create" component={CreateStrategy} />
      <Route path="/deployed-strategies" component={DeployedStrategies} />
      <Route path="/deploy-strategy" component={DeployStrategy} />
      <Route path="/strategy-recommendations" component={StrategyRecommendations} />
      <Route path="/risk-management" component={RiskManagement} />
      <Route path="/charts" component={Charts} />
      <Route path="/backtesting" component={Backtesting} />
      <Route path="/reports" component={Reports} />
      <Route path="/broker-setup" component={BrokerSetup} />
      <Route path="/billing" component={Billing} />
      <Route path="/settings" component={Settings} />
      {/* <Route path="/checkout" component={Checkout} /> */}
      {/* <Route path="/subscribe" component={Subscribe} /> */}
      <Route path="/test" component={TestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Get current path to determine if we're on a payment page or test page
  const path = window.location.pathname;
  const isFullPageRoute = path === '/checkout' || path === '/subscribe' || path === '/test';

  return (
    <QueryClientProvider client={queryClient}>
      {isFullPageRoute ? (
        // Render full-screen pages without sidebar
        <main className="h-screen">
          <Router />
        </main>
      ) : (
        // Render normal dashboard layout
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <MobileNav 
              isOpen={mobileMenuOpen} 
              onOpenChange={setMobileMenuOpen} 
            />
            
            <main className="flex-1 overflow-y-auto bg-neutral-50 pb-16 lg:pb-0">
              <Router />
            </main>
          </div>
        </div>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
