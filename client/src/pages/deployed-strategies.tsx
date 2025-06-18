import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  MoreVertical, 
  Play, 
  Pause, 
  Archive, 
  AlertTriangle, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DeployedStrategy = {
  id: number;
  name: string;
  strategyId: string;
  brokerId: number;
  userId: string;
  lotMultiplier: string;
  capitalDeployed: string;
  tradingType: string;
  status: string;
  currentPnl: string;
  percentPnl: string;
  deployedAt: string;
  lastUpdated: string;
  broker?: string; // For display purposes
  symbolName?: string; // For display purposes
};
// type DeployedStrategy = {
//   ID: number;
//   Name: string;
//   StrategyID: string;
//   BrokerID: number;
//   UserID: string;
//   LotMultiplier: string;
//   CapitalDeployed: string;
//   TradingType: string;
//   Status: string;
//   currentPnl: number;
//   percentPnl: number;
//   DeployedAt: string;
//   LastUpdated: string;
//   Metadata: any | null;


//   // Optional display-only properties (not from backend)
//   broker?: string;
//   symbolName?: string;
// };

// Sample options for sort and filtering
const BROKER_OPTIONS = [
  { value: "any", label: "Any Broker" },
  { value: "zerodha", label: "Zerodha" },
  { value: "dhan", label: "Dhan" },
  { value: "angel", label: "Angel Broking" },
  { value: "finvasia", label: "Finvasia" },
  { value: "paper", label: "TT Paper Trading" },
];

const STATUS_OPTIONS = [
  { value: "any", label: "Any Status" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
  { value: "error", label: "Error" },
];

// Position details type for the detailed view
type PositionDetail = {
  symbol: string;
  qty: number;
  ltp: number;
  val: number;
  pnl: number;
  iv?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
};

export default function DeployedStrategiesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState("deployed");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBroker, setFilterBroker] = useState("any");
  const [filterStatus, setFilterStatus] = useState("any");
  const [sortBy, setSortBy] = useState("expiry");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStrategy, setSelectedStrategy] = useState<DeployedStrategy | null>(null);

  const transformStrategy = (s: any): DeployedStrategy => ({
  id: s.ID,
  name: s.Name,
  strategyId: s.StrategyID,
  brokerId: s.BrokerID,
  userId: s.UserID,
  lotMultiplier: s.LotMultiplier,
  capitalDeployed: s.CapitalDeployed,
  tradingType: s.TradingType,
  status: s.Status,
  currentPnl: s.CurrentPnl,
  percentPnl: s.PercentPnl,
  deployedAt: s.DeployedAt,
  lastUpdated: s.LastUpdated,
  broker: getBrokerNameById(s.BrokerID),
  symbolName: getSymbolNameForStrategy(s.ID),
});
  
  // For pagination
  const itemsPerPage = 10;
  
  // const { data: deployedStrategies, isLoading } = useQuery({
  //   queryKey: ['/api/deployed-strategies'],
  //   queryFn: async () => {
  //     const response = await apiRequest('GET', 'http://localhost:8080/deploy-strategy');
  //     console.log("This is response ---- " + response);
  //     const strategies = await response.json() as DeployedStrategy[];
  //     console.log("Fetched strategies:", strategies);
  //     // Enrich with broker names for display
  //     return strategies.map(strategy => ({
  //       ...strategy,
  //       broker: getBrokerNameById(strategy.brokerId),
  //       symbolName: getSymbolNameForStrategy(strategy.id)
  //     }));
  //   },
  // });
  const { data: deployedStrategies, isLoading } = useQuery({
  queryKey: ['/api/deployed-strategies'],
  queryFn: async () => {
    const response = await apiRequest('GET', 'http://localhost:8080/deploy-strategy');
    const raw = await response.json();
    return raw.map(transformStrategy);
  },
  
});

  
  // Sample position details for the selected strategy
  const [positionDetails, setPositionDetails] = useState<PositionDetail[]>([
    {
      symbol: "1_OPTIDX_BANKNIFTY_24APR2025_CE_50200",
      qty: 0,
      ltp: 1110.05,
      val: 0,
      pnl: -16.90,
      iv: 24,
      delta: 0,
      gamma: 0.00,
      theta: 0,
      vega: 0
    },
    {
      symbol: "2_OPTIDX_BANKNIFTY_24APR2025_PE_50200", 
      qty: 0,
      ltp: 823.45,
      val: 0,
      pnl: 13.51,
      iv: 24,
      delta: 0,
      gamma: 0.00,
      theta: 0,
      vega: 0
    }
  ]);

  // Helper to get broker name by ID - this would be replaced with real data
  const getBrokerNameById = (id: number): string => {
    const brokerMap: Record<number, string> = {
      1: "Zerodha",
      2: "Dhan",
      3: "Angel Broking",
      4: "Finvasia",
      5: "TT Paper Trading"
    };
    return brokerMap[id] || "Unknown Broker";
  };
  
  // Helper to get symbol name for strategy - this would be replaced with real data
  const getSymbolNameForStrategy = (id: number): string => {
    return id % 2 === 0 ? "BANKNIFTY" : "NIFTY";
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest('PATCH', `/api/deployed-strategies/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deployed-strategies'] });
      setIsUpdating(null);
      toast({
        title: "Status Updated",
        description: "Strategy status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
      setIsUpdating(null);
    }
  });

  const updateStatus = (id: number, status: string) => {
    setIsUpdating(id);
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTradingTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "live":
        return <Badge className="bg-purple-600">Live Trading</Badge>;
      case "paper":
        return <Badge variant="outline" className="border-blue-400 text-blue-400">Paper Trading</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Filter and sort the deployed strategies
  const filteredStrategies = deployedStrategies ? deployedStrategies.filter(strategy => {
    // Filter by search query
    const matchesQuery = 
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (strategy.symbolName && strategy.symbolName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by broker
    const matchesBroker = filterBroker === "any" || (strategy.broker && strategy.broker.toLowerCase().includes(filterBroker.toLowerCase()));
    
    // Filter by status
    const matchesStatus = filterStatus === "any" || strategy.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesQuery && matchesBroker && matchesStatus;
  }) : [];
  
  // Sort the filtered strategies
  const sortedStrategies = [...filteredStrategies].sort((a, b) => {
    switch (sortBy) {
      case "pnl":
        return parseFloat(b.currentPnl) - parseFloat(a.currentPnl);
      case "return":
        return parseFloat(b.percentPnl) - parseFloat(a.percentPnl);
      case "name":
        return a.name.localeCompare(b.name);
      case "expiry":
      default:
        // Sort by most recently deployed
        return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
    }
  });

  // Paginate the strategies
  const paginatedStrategies = sortedStrategies.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(sortedStrategies.length / itemsPerPage);

  // Summary metrics calculations
  const totalCapital = filteredStrategies.reduce((sum, strategy) => sum + parseFloat(strategy.capitalDeployed), 0);
  const totalPnL = filteredStrategies.reduce((sum, strategy) => sum + parseFloat(strategy.currentPnl), 0);
  
  // Calculate overall percentage P&L
  const overallPercentPnL = totalCapital ? (totalPnL / totalCapital) * 100 : 0;
  
  // Calculate additional metrics
  const activeStrategies = filteredStrategies.filter(s => s.status.toLowerCase() === 'active').length;
  const pausedStrategies = filteredStrategies.filter(s => s.status.toLowerCase() === 'paused').length;
  const profitableStrategies = filteredStrategies.filter(s => parseFloat(s.currentPnl) > 0).length;
  const profitabilityRate = filteredStrategies.length > 0 ? (profitableStrategies / filteredStrategies.length) * 100 : 0;
  
  // Handle strategy selection and detail view
  const handleStrategySelect = (strategy: DeployedStrategy) => {
    setSelectedStrategy(strategy);
    // In a real app, you would fetch position details here
  };
  
  const handleBackToList = () => {
    setSelectedStrategy(null);
  };

  // Render the strategy detail view
  const renderStrategyDetail = () => {
    if (!selectedStrategy) return null;
    
    const totalPnl = positionDetails.reduce((sum, position) => sum + position.pnl, 0);
    const totalValue = positionDetails.reduce((sum, position) => sum + position.val, 0);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBackToList} className="flex items-center space-x-2">
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h2 className="text-2xl font-bold flex-1">{selectedStrategy.name}</h2>
          <Button 
            variant={selectedStrategy.status === "active" ? "outline" : "default"}
            onClick={() => updateStatus(selectedStrategy.id, selectedStrategy.status === "active" ? "paused" : "active")}
            className="flex items-center space-x-2"
          >
            {selectedStrategy.status === "active" ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </>
            )}
          </Button>
          <Select value={selectedStrategy.lotMultiplier} onValueChange={() => {}}>
            <SelectTrigger className="w-[120px]">
              <span className="flex items-center">
                <span className="mr-2">Multiplier:</span>
                <SelectValue placeholder="Select" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1x">1x</SelectItem>
              <SelectItem value="2x">2x</SelectItem>
              <SelectItem value="5x">5x</SelectItem>
              <SelectItem value="10x">10x</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View History</DropdownMenuItem>
              <DropdownMenuItem>Edit Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Close Positions</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-neutral-500">Deployed on</div>
            <div className="text-xl font-semibold">{formatDate(selectedStrategy.deployedAt)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-neutral-500">Capital</div>
            <div className="text-xl font-semibold">{formatCurrency(selectedStrategy.capitalDeployed)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-neutral-500">P&L</div>
            <div className={`text-xl font-semibold ${parseFloat(selectedStrategy.currentPnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(selectedStrategy.currentPnl)} ({selectedStrategy.percentPnl})
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-neutral-500">Broker</div>
            <div className="text-xl font-semibold">{selectedStrategy.broker}</div>
          </Card>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instrument Symbol</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">LTP ₹</TableHead>
                  <TableHead className="text-right">Val ₹</TableHead>
                  <TableHead className="text-right">P&L ₹</TableHead>
                  <TableHead className="text-right">IV %</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="text-right">Gamma</TableHead>
                  <TableHead className="text-right">Theta</TableHead>
                  <TableHead className="text-right">Vega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionDetails.map((position, index) => (
                  <TableRow key={index}>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell className="text-right">{position.qty}</TableCell>
                    <TableCell className="text-right">{position.ltp.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{position.val}</TableCell>
                    <TableCell className={`text-right ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} k
                    </TableCell>
                    <TableCell className="text-right">{position.iv}%</TableCell>
                    <TableCell className="text-right">{position.delta}</TableCell>
                    <TableCell className="text-right">{position.gamma ? position.gamma.toFixed(2) : '0.00'}</TableCell>
                    <TableCell className="text-right">{position.theta}</TableCell>
                    <TableCell className="text-right">{position.vega}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-neutral-50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right">{totalValue}</TableCell>
                  <TableCell className={`text-right ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} k
                  </TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell className="text-right">0</TableCell>
                  <TableCell className="text-right">0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <div className="text-sm text-neutral-500">
          Delta: 0 | Gamma: 0 | Theta: 0 | Vega: 0 | <span className={`${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>P&L: {totalPnl.toFixed(2)} k ({`${totalPnl >= 0 ? '+' : ''}`}{(totalPnl/parseFloat(selectedStrategy.capitalDeployed)*100).toFixed(2)}%)</span>
        </div>
      </div>
    );
  };

  // Render the strategy list view
  const renderStrategyList = () => {
    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-[400px] grid-cols-3">
                <TabsTrigger value="deployed">Deployed</TabsTrigger>
                <TabsTrigger value="my-strategies">My Strategies</TabsTrigger>
                <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="ml-auto">
              <Button 
                variant="default"
                onClick={() => navigate("/deploy-strategy")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Deploy New
              </Button>
            </div>
          </div>
        </div>
        
        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Summary</h3>
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="bg-white">
                  Switch to Lite
                </Button>
                <div className="ml-6 w-40">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expiry">Expiry</SelectItem>
                      <SelectItem value="pnl">P&L</SelectItem>
                      <SelectItem value="return">Return %</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-8 mt-4">
              <div>
                <p className="text-sm text-neutral-500">Capital:</p>
                <p className="text-xl font-bold">₹ {(totalCapital/1000).toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">P&L:</p>
                <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹ {totalPnL >= 0 ? '+' : ''}{(totalPnL/1000).toFixed(2)} L ({overallPercentPnL >= 0 ? '+' : ''}{overallPercentPnL.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Value (Pos):</p>
                <p className="text-xl font-bold">₹ 0 (0)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-neutral-500">Total Strategies:</p>
                <p className="text-lg font-semibold">{filteredStrategies.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500">Active:</p>
                <p className="text-lg font-semibold text-green-600">{activeStrategies}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500">Paused:</p>
                <p className="text-lg font-semibold text-yellow-600">{pausedStrategies}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500">Profitability:</p>
                <p className="text-lg font-semibold">{profitabilityRate.toFixed(1)}% <span className="text-xs text-neutral-500">({profitableStrategies}/{filteredStrategies.length})</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input 
              placeholder="Search Strategies" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBroker} onValueChange={setFilterBroker}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Broker" />
            </SelectTrigger>
            <SelectContent>
              {BROKER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Strategy List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedStrategies.length > 0 ? (
          <>
            <div className="overflow-x-auto mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Strategy</TableHead>
                    <TableHead>Deployed on</TableHead>
                    <TableHead>Capital</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Counter</TableHead>
                    <TableHead>P&L ₹</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStrategies.map((strategy) => (
                    <TableRow 
                      key={strategy.id} 
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => handleStrategySelect(strategy)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{strategy.name}</div>
                          <div className="text-sm text-neutral-500">by User</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(strategy.deployedAt)}</TableCell>
                      <TableCell>{formatCurrency(strategy.capitalDeployed)}</TableCell>
                      <TableCell>{getStatusBadge(strategy.status)}</TableCell>
                      <TableCell>{strategy.broker}</TableCell>
                      <TableCell>
                        <Select defaultValue="241">
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Counter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="241">241 (₹ -3,397)</SelectItem>
                            <SelectItem value="242">242 (₹ +2,105)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={`font-medium ${parseFloat(strategy.currentPnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(strategy.currentPnl)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isUpdating === strategy.id ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        ) : (
                          <Button 
                            variant={strategy.status === "active" ? "outline" : "default"} 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(strategy.id, strategy.status === "active" ? "paused" : "active");
                            }}
                          >
                            {strategy.status === "active" ? "Pause" : "Start"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-4">
              <Play className="h-12 w-12 mx-auto text-neutral-300" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Deployed Strategies</h3>
            <p className="text-neutral-500 mb-4">
              You haven't deployed any trading strategies yet. Deploy a strategy to start trading.
            </p>
            <Button onClick={() => navigate("/deploy-strategy")}>
              Deploy Your First Strategy
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-[1400px]">
      {selectedStrategy ? renderStrategyDetail() : renderStrategyList()}
      
      {/* Tooltip components used in the page are wrapped with TooltipProvider from parent component */}
    </div>
  );
}