import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Menu,
  X,
  LineChart,
  LayoutDashboard,
  Code,
  BarChart3,
  DollarSign,
  Settings,
  CreditCard,
  Sliders,
  Play,
  ShieldAlert
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onOpenChange }) => {
  const [location] = useLocation();

  return (
    <div className="lg:hidden w-full fixed top-0 bg-neutral-800 text-white z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <LineChart className="w-6 h-6 text-primary" />
          <span className="ml-2 font-semibold text-lg">FinanceSUTRA</span>
        </div>
        
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <button className="p-1">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-neutral-800 text-white">
            <div className="p-4 flex justify-between items-center border-b border-neutral-700">
              <div className="flex items-center">
                <LineChart className="w-6 h-6 text-primary" />
                <span className="ml-2 font-semibold text-lg">FinanceSUTRA</span>
              </div>
              <button className="p-1" onClick={() => onOpenChange(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="mt-5">
              <Link href="/">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="ml-3">Dashboard</span>
                </a>
              </Link>
              
              <Link href="/strategies">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location.startsWith('/strategies')
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Code className="w-5 h-5" />
                  <span className="ml-3">Strategies</span>
                </a>
              </Link>
              
              <Link href="/charts">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/charts'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <LineChart className="w-5 h-5" />
                  <span className="ml-3">Charts</span>
                </a>
              </Link>
              
              <Link href="/backtesting">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/backtesting'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="ml-3">Backtesting</span>
                </a>
              </Link>
              
              <Link href="/deployed-strategies">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/deployed-strategies' || location === '/deploy-strategy'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Play className="w-5 h-5" />
                  <span className="ml-3">Deployed Strategies</span>
                </a>
              </Link>
              
              <Link href="/risk-management">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/risk-management'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="ml-3">Risk Management</span>
                </a>
              </Link>
              
              <Link href="/reports">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/reports'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="ml-3">P&L Reports</span>
                </a>
              </Link>
              
              <Link href="/broker-setup">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/broker-setup'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Sliders className="w-5 h-5" />
                  <span className="ml-3">Broker Setup</span>
                </a>
              </Link>
              
              <Link href="/billing">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/billing'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="ml-3">Billing</span>
                </a>
              </Link>
              
              <Link href="/settings">
                <a
                  className={`flex items-center px-4 py-3 ${
                    location === '/settings'
                      ? 'text-primary bg-neutral-900 border-l-4 border-primary'
                      : 'text-neutral-400 hover:bg-neutral-700'
                  }`}
                  onClick={() => onOpenChange(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span className="ml-3">Settings</span>
                </a>
              </Link>
            </nav>
            
            <div className="absolute bottom-0 w-full bg-neutral-900 p-4">
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User profile"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">John Trader</p>
                  <p className="text-xs text-neutral-400">Pro Plan</p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default MobileNav;
