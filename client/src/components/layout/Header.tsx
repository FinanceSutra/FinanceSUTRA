import React from 'react';
import { ChevronDown, Calendar, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  dateRangeSelector?: boolean;
  onDateRangeChange?: (range: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  description,
  actions,
  dateRangeSelector = false,
  onDateRangeChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      <div className="mt-4 md:mt-0 flex space-x-3">
        {dateRangeSelector && (
          <div className="relative">
            <Select onValueChange={onDateRangeChange} defaultValue="7d">
              <SelectTrigger className="bg-white px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-50 min-w-[150px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {actions || (
          <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
