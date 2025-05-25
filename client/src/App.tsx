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
import DirectTrade from "@/pages/direct-trade";
import Backtesting from "@/pages/backtesting";
import Reports from "@/pages/reports";
import BrokerSetup from "@/pages/broker-setup";
import BrokerConnectionDetails from "@/pages/broker-connection-details";
import Billing from "@/pages/billing";
import Settings from "@/pages/settings";
import Checkout from "@/pages/checkout";
import Subscribe from "@/pages/subscribe";
import OptionWizard from "@/pages/option-wizard";
import TestPage from "@/pages/test";
import AuthPage from "@/pages/auth-page";
import LearningPage from "@/pages/learning";
import TradingWorkflows from "@/pages/trading-workflows";
import CreateWorkflow from "@/pages/create-workflow";
import WorkflowDetails from "@/pages/workflow-details";
import PortfolioAnalysis from "@/pages/portfolio-analysis";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { useState } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import React from "react";

// Explicitly type the page components with React.ComponentType
const pageComponents = {
  Dashboard: Dashboard as React.ComponentType,
  Strategies: Strategies as React.ComponentType,
  StrategyEditor: StrategyEditor as React.ComponentType,
  CreateStrategy: CreateStrategy as React.ComponentType,
  DeployedStrategies: DeployedStrategies as React.ComponentType,
  DeployStrategy: DeployStrategy as React.ComponentType,
  StrategyRecommendations: StrategyRecommendations as React.ComponentType,
  RiskManagement: RiskManagement as React.ComponentType,
  Charts: Charts as React.ComponentType,
  DirectTrade: DirectTrade as React.ComponentType,
  Backtesting: Backtesting as React.ComponentType,
  Reports: Reports as React.ComponentType,
  BrokerSetup: BrokerSetup as React.ComponentType,
  BrokerConnectionDetails: BrokerConnectionDetails as React.ComponentType,
  Billing: Billing as React.ComponentType,
  Settings: Settings as React.ComponentType,
  Checkout: Checkout as React.ComponentType,
  Subscribe: Subscribe as React.ComponentType,
  OptionWizard: OptionWizard as React.ComponentType,
  LearningPage: LearningPage as React.ComponentType,
  TradingWorkflows: TradingWorkflows as React.ComponentType,
  CreateWorkflow: CreateWorkflow as React.ComponentType,
  WorkflowDetails: WorkflowDetails as React.ComponentType,
  PortfolioAnalysis: PortfolioAnalysis as React.ComponentType,
  TestPage: TestPage as React.ComponentType,
  AuthPage: AuthPage as React.ComponentType,
  NotFound: NotFound as React.ComponentType
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={pageComponents.Dashboard} />
      <ProtectedRoute path="/strategies" component={pageComponents.Strategies} />
      <ProtectedRoute path="/strategies/editor/:id?" component={pageComponents.StrategyEditor} />
      <ProtectedRoute path="/strategies/create" component={pageComponents.CreateStrategy} />
      <ProtectedRoute path="/deployed-strategies" component={pageComponents.DeployedStrategies} />
      <ProtectedRoute path="/deploy-strategy" component={pageComponents.DeployStrategy} />
      <ProtectedRoute path="/strategy-recommendations" component={pageComponents.StrategyRecommendations} />
      <ProtectedRoute path="/risk-management" component={pageComponents.RiskManagement} />
      <ProtectedRoute path="/charts" component={pageComponents.Charts} />
      <ProtectedRoute path="/direct-trade" component={pageComponents.DirectTrade} />
      <ProtectedRoute path="/backtesting" component={pageComponents.Backtesting} />
      <ProtectedRoute path="/reports" component={pageComponents.Reports} />
      <ProtectedRoute path="/broker-setup" component={pageComponents.BrokerSetup} />
      <ProtectedRoute path="/broker-connection-details" component={pageComponents.BrokerConnectionDetails} />
      <ProtectedRoute path="/billing" component={pageComponents.Billing} />
      <ProtectedRoute path="/settings" component={pageComponents.Settings} />
      <ProtectedRoute path="/checkout" component={pageComponents.Checkout} />
      <ProtectedRoute path="/subscribe" component={pageComponents.Subscribe} />
      <ProtectedRoute path="/option-wizard" component={pageComponents.OptionWizard} />
      <ProtectedRoute path="/learning" component={pageComponents.LearningPage} />
      <ProtectedRoute path="/trading-workflows" component={pageComponents.TradingWorkflows} />
      <ProtectedRoute path="/create-workflow" component={pageComponents.CreateWorkflow} />
      <ProtectedRoute path="/edit-workflow/:id" component={pageComponents.CreateWorkflow} />
      <ProtectedRoute path="/workflow/:id" component={pageComponents.WorkflowDetails} />
      <ProtectedRoute path="/portfolio-analysis" component={pageComponents.PortfolioAnalysis} />
      <ProtectedRoute path="/test" component={pageComponents.TestPage} />
      <Route path="/auth">
        {(params) => <pageComponents.AuthPage {...params} />}
      </Route>
      <Route>
        {(params) => <pageComponents.NotFound {...params} />}
      </Route>
    </Switch>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Get current path to determine if we're on a payment page or test page
  const path = window.location.pathname;
  const isFullPageRoute = path === '/checkout' || path === '/subscribe' || path === '/test' || path === '/auth';

  // Directly export the app wrapped in error boundary
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {isFullPageRoute ? (
            // Render full-screen pages without sidebar
            <main className="h-screen bg-white">
              <div className="mx-auto container px-4 py-4">
                <Router />
              </div>
            </main>
          ) : (
            // Render clean trading app layout
            <div className="flex h-screen overflow-hidden bg-white">
              <Sidebar />
              
              <div className="flex-1 flex flex-col overflow-hidden">
                <MobileNav 
                  isOpen={mobileMenuOpen} 
                  onOpenChange={setMobileMenuOpen} 
                />
                
                <main className="flex-1 overflow-y-auto scrollbar-hidden pb-16 lg:pb-0">
                  <div className="mx-auto px-5 py-4">
                    <Router />
                  </div>
                </main>
              </div>
            </div>
          )}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <h1 className="text-xl font-medium text-red-600 mb-3">Something went wrong</h1>
        <p className="mb-4 text-sm text-gray-600">We're experiencing technical difficulties. Please try again later.</p>
        <button 
          className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-md text-sm font-medium"
          onClick={() => window.location.href = '/auth'}
        >
          Go to login
        </button>
      </div>
    );
  }
}

export default App;



// Old App.tsx which is working

// import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import NotFound from "@/pages/not-found";
// import Dashboard from "@/pages/dashboard";
// import Strategies from "@/pages/strategies";
// import StrategyEditor from "@/pages/strategy-editor";
// import CreateStrategy from "@/pages/create-strategy";
// import DeployedStrategies from "@/pages/deployed-strategies";
// import DeployStrategy from "@/pages/deploy-strategy";
// import StrategyRecommendations from "@/pages/strategy-recommendations";
// import RiskManagement from "@/pages/risk-management";
// import Charts from "@/pages/charts";
// import Backtesting from "@/pages/backtesting";
// import Reports from "@/pages/reports";
// import BrokerSetup from "@/pages/broker-setup";
// import Billing from "@/pages/billing";
// import Settings from "@/pages/settings";
// import Checkout from "@/pages/checkout";
// import Subscribe from "@/pages/subscribe";
// import TestPage from "@/pages/test";
// import Sidebar from "@/components/layout/Sidebar";
// import MobileNav from "@/components/layout/MobileNav";
// import { useState } from "react";
// import TradingWorkflows from "./pages/trading-workflows";
// import CreateWorkflow from "@/pages/create-workflow";
// import WorkflowDetails from "@/pages/workflow-details";
// import AuthPage from "./pages/auth-page";
// import { AuthProvider } from "@/hooks/use-auth";
// import { ProtectedRoute } from "@/lib/protected-route";
// import OptionWizard from "@/pages/option-wizard";
// import DirectTrade from "@/pages/direct-trade";
// import LearningPage from "@/pages/learning";



// function Router() {
//   return (
//     <Switch>
//       <Route path="/" component={Dashboard} />
//       <Route path="/strategies" component={Strategies} />
//       <Route path="/strategies/editor/:id?" component={StrategyEditor} />
//       <Route path="/strategies/create" component={CreateStrategy} />
//       <Route path="/deployed-strategies" component={DeployedStrategies} />
//       <Route path="/deploy-strategy" component={DeployStrategy} />
//       <Route path="/strategy-recommendations" component={StrategyRecommendations} />
//       <Route path="/charts" component={Charts} />
//       <Route path="/backtesting" component={Backtesting} />
//       <Route path="/reports" component={Reports} />
//       <Route path="/broker-setup" component={BrokerSetup} />
//       <Route path="/billing" component={Billing} />
//       <Route path="/settings" component={Settings} />
//       <Route path='/trading-workflows' component={TradingWorkflows} />
//       <Route path = '/create-workflow' component={CreateWorkflow} />
//       <Route path = '/workflow.:id' component={WorkflowDetails} />
//       <Route path='/direct-trade' component={DirectTrade} />
//       <AuthProvider>
//       <Route path='/learning' component={LearningPage} />
//         <Route path = '/auth' component={AuthPage} />
//         <Route path="/risk-management" component={RiskManagement} />
//       </AuthProvider>
//       <AuthProvider>
//         <Route component={NotFound} />
//       </AuthProvider>
//       <Route path='/test' component={TestPage}></Route>
//       {/* <Route path="/checkout" component={Checkout} /> */}
//       {/* <Route path="/subscribe" component={Subscribe} /> */}
//       <Route path="/trading-workflows" component={TradingWorkflows} />
//       <Route path="/create-workflow" component={CreateWorkflow} />
//       <Route path="/edit-workflow/:id" component={CreateWorkflow} />
//       <Route path="/workflow/:id" component={WorkflowDetails} />
//       <Route path="/test" component={TestPage} />
      
//     </Switch>
//   );
// }

// function App() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   // Get current path to determine if we're on a payment page or test page
//   const path = window.location.pathname;
//   const isFullPageRoute = path === '/checkout' || path === '/subscribe' || path === '/test';

//   return (
//     <QueryClientProvider client={queryClient}>
//       {isFullPageRoute ? (
//         // Render full-screen pages without sidebar
//         <main className="h-screen">
//           <Router />
//         </main>
//       ) : (
//         // Render normal dashboard layout
//         <div className="flex h-screen overflow-hidden">
//           <Sidebar />
          
//           <div className="flex-1 flex flex-col overflow-hidden">
//             <MobileNav 
//               isOpen={mobileMenuOpen} 
//               onOpenChange={setMobileMenuOpen} 
//             />
            
//             <main className="flex-1 overflow-y-auto bg-neutral-50 pb-16 lg:pb-0">
//               <Router />
//             </main>
//           </div>
//         </div>
//       )}
//       <Toaster />
//     </QueryClientProvider>
//   );
// }

// export default App;
