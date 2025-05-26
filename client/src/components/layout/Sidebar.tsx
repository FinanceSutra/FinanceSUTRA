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
  GraduationCap,
  Workflow,
  BarChart2,
  PieChart,
  Brain,
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
      <div
        className={`flex items-center px-3 py-2 text-sm transition-all duration-200 ${
          isActive
            ? 'text-primary font-medium bg-gray-50'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-500'}`}>{icon}</span>
        <span className="ml-2">{children}</span>
      </div>
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
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-all duration-200
        ${isActive 
          ? 'text-primary font-medium bg-gray-50' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
      >
        <div className="flex items-center">
          <span className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-500'}`}>{icon}</span>
          <span className="ml-2">{title}</span>
        </div>
        <ChevronDown 
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div className="pl-3 pb-0.5 pt-0.5 space-y-0.5 ml-1.5 border-l border-gray-200">
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
    <div className="w-56 bg-white shadow-sm border-r border-gray-200 text-gray-800 hidden lg:block">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center">
          <LineChart className="w-6 h-6 text-primary" />
          <span className="ml-2 font-medium text-base text-gray-800">FinanceSUTRA</span>
        </div>
      </div>
      <nav className="mt-2 px-2 space-y-0.5">
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
            <div className={`flex items-center py-1.5 px-2 text-xs rounded transition-colors duration-200 ${
              location === '/strategies'
                ? 'text-primary bg-gray-50 font-medium'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}>
              <List className={`h-3.5 w-3.5 mr-1.5 ${location === '/strategies' ? 'text-primary' : 'text-gray-500'}`} />
              <span>My Strategies</span>
            </div>
          </Link>
          
          <Link href="/deployed-strategies">
            <div className={`flex items-center py-1.5 px-2 text-xs rounded transition-colors duration-200 ${
              location === '/deployed-strategies' || location === '/deploy-strategy'
                ? 'text-primary bg-gray-50 font-medium'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}>
              <Play className={`h-3.5 w-3.5 mr-1.5 ${location === '/deployed-strategies' || location === '/deploy-strategy' ? 'text-primary' : 'text-gray-500'}`} />
              <span>Deployed Strategies</span>
            </div>
          </Link>
          
          <Link href="/strategy-recommendations">
            <div className={`flex items-center py-1.5 px-2 text-xs rounded transition-colors duration-200 ${
              location === '/strategy-recommendations'
                ? 'text-primary bg-gray-50 font-medium'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}>
              <Lightbulb className={`h-3.5 w-3.5 mr-1.5 ${location === '/strategy-recommendations' ? 'text-primary' : 'text-gray-500'}`} />
              <span>Recommendations</span>
            </div>
          </Link>
        </NavGroup>
        
        <NavItem href="/direct-trade" icon={<LineChart />} isActive={location === '/direct-trade'}>
          Direct Trade
        </NavItem>
        <NavItem href="/backtesting" icon={<BarChart3 />} isActive={location === '/backtesting'}>
          Backtesting
        </NavItem>
        <NavItem href="/risk-management" icon={<ShieldAlert />} isActive={location === '/risk-management'}>
          Risk Management
        </NavItem>
         <NavItem href="/portfolio-analysis" icon={<PieChart />} isActive={location === '/portfolio-analysis'}>
          Portfolio Analysis
        </NavItem>
        <NavItem href="/research" icon={<Brain />} isActive={location === '/research'}>
          AI Research
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
        <NavItem href="/learning" icon={<GraduationCap />} isActive={location === '/learning'}>
          Learning Center
        </NavItem>
        <NavItem href="/billing" icon={<CreditCard />} isActive={location === '/billing'}>
          Billing
        </NavItem>
        <NavItem href="/settings" icon={<Settings />} isActive={location === '/settings'}>
          Settings
        </NavItem>
      </nav>
      <div className="absolute bottom-0 w-56 bg-white border-t border-gray-200 p-3">
        <div className="flex items-center">
          <img className="h-8 w-8 rounded-full ring-1 ring-gray-200" src={user.image} alt="User profile" />
          <div className="ml-2">
            <p className="text-xs font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-primary">{user.plan}</p>
          </div>
          <button className="ml-auto p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
