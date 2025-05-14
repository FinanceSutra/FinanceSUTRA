import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LineChart,
  LayoutDashboard,
  Code,
  BarChart3,
  DollarSign,
  Settings,
  CreditCard,
  Sliders,
  ChevronDown,
  Play,
  List,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Workflow,
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

interface NavGroupProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  isActive?: boolean;
  isOpen?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children, isActive }) => {
  return (
    <Link href={href}>
      <a
        className={`flex items-center px-4 py-3 ${
          isActive
            ? 'text-primary bg-neutral-900 border-l-4 border-primary'
            : 'text-neutral-400 hover:bg-neutral-700'
        }`}
      >
        <span className="w-5 h-5">{icon}</span>
        <span className="ml-3">{children}</span>
      </a>
    </Link>
  );
};

const NavGroup: React.FC<NavGroupProps> = ({ 
  icon, 
  title, 
  isActive, 
  isOpen, 
  onToggle, 
  children 
}) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-4 py-3 
        ${isActive ? 'text-primary' : 'text-neutral-400 hover:bg-neutral-700'}`}
      >
        <div className="flex items-center">
          <span className="w-5 h-5">{icon}</span>
          <span className="ml-3">{title}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="pl-4 bg-neutral-900 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [strategiesOpen, setStrategiesOpen] = useState(true);
  
  // Mock user data - in a real app, this would come from the API
  const user = {
    name: 'John Trader',
    plan: 'Pro Plan',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  };

  // Check if any strategy-related page is active
  const isStrategiesActive = location.startsWith('/strategies') || 
                            location === '/deployed-strategies' || 
                            location === '/deploy-strategy' ||
                            location === '/strategy-recommendations';

  return (
    <div className="w-64 bg-neutral-800 text-white hidden lg:block">
      <div className="p-4 border-b border-neutral-700">
        <div className="flex items-center">
          <LineChart className="w-8 h-8 text-primary" />
          <span className="ml-2 font-semibold text-lg">FinanceSUTRA</span>
        </div>
      </div>
      <nav className="mt-5">
        <NavItem href="/" icon={<LayoutDashboard />} isActive={location === '/'}>
          Dashboard
        </NavItem>
        
        <NavGroup 
          icon={<Code />} 
          title="Strategies"
          isActive={isStrategiesActive}
          isOpen={strategiesOpen}
          onToggle={() => setStrategiesOpen(!strategiesOpen)}
        >
          <Link href="/strategies">
            <a className={`flex items-center py-2 px-4 ${
              location === '/strategies'
                ? 'text-primary'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}>
              <List className="h-4 w-4 mr-2" />
              <span>My Strategies</span>
            </a>
          </Link>
          
          <Link href="/deployed-strategies">
            <a className={`flex items-center py-2 px-4 ${
              location === '/deployed-strategies' || location === '/deploy-strategy'
                ? 'text-primary'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}>
              <Play className="h-4 w-4 mr-2" />
              <span>Deployed Strategies</span>
            </a>
          </Link>
          
          <Link href="/strategy-recommendations">
            <a className={`flex items-center py-2 px-4 ${
              location === '/strategy-recommendations'
                ? 'text-primary'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}>
              <Lightbulb className="h-4 w-4 mr-2" />
              <span>Strategy Recommendations</span>
            </a>
          </Link>
        </NavGroup>
        
        <NavItem href="/charts" icon={<LineChart />} isActive={location === '/charts'}>
          Charts
        </NavItem>
        <NavItem href="/backtesting" icon={<BarChart3 />} isActive={location === '/backtesting'}>
          Backtesting
        </NavItem>
        <NavItem href="/risk-management" icon={<ShieldAlert />} isActive={location === '/risk-management'}>
          Risk Management
        </NavItem>
        <NavItem href="/trading-workflows" icon={<Workflow />} isActive={location === '/trading-workflows'}>
          Workflow Automation
        </NavItem>
        <NavItem href="/reports" icon={<DollarSign />} isActive={location === '/reports'}>
          P&L Reports
        </NavItem>
        <NavItem href="/broker-setup" icon={<Sliders />} isActive={location === '/broker-setup'}>
          Broker Setup
        </NavItem>
        <NavItem href="/billing" icon={<CreditCard />} isActive={location === '/billing'}>
          Billing
        </NavItem>
        <NavItem href="/settings" icon={<Settings />} isActive={location === '/settings'}>
          Settings
        </NavItem>
      </nav>
      <div className="absolute bottom-0 w-64 bg-neutral-900 p-4">
        <div className="flex items-center">
          <img className="h-8 w-8 rounded-full" src={user.image} alt="User profile" />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-neutral-400">{user.plan}</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-white">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
