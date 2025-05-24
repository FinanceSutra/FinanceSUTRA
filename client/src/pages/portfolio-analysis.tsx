import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  Download,
  FileUp,
  LineChart,
  Loader2,
  PieChart,
  ShieldAlert,
  TriangleAlert,
  Check,
  X,
  Plus,
  Minus,
  Percent,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Info,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";

// Define interfaces for portfolio data
interface PortfolioHolding {
  symbol: string;
  name: string;
  type: string;  // Equity, MF, ETF, Gold, Bond, etc.
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
  allocation: number; // Percentage of portfolio
  sector?: string;
  beta?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

interface RiskAnalysis {
  overallRisk: 'Low' | 'Medium' | 'High';
  diversificationScore: number; // 0-100
  sectorConcentration: {
    sector: string;
    percentage: number;
  }[];
  volatility: number;
  beta: number;
  sharpeRatio: number;
  portfolioCorrelation: number;
  maxDrawdown: number;
  riskContributors: {
    symbol: string;
    contribution: number;
  }[];
}

interface MarketComparison {
  nifty50Performance: number;
  portfolioPerformance: number;
  indexComparisons: {
    indexName: string;
    indexPerformance: number;
  }[];
  sectoralIndices: {
    sector: string;
    indexPerformance: number;
    holdingsPerformance: number;
  }[];
}

interface PortfolioSuggestion {
  type: 'add' | 'remove' | 'reduce' | 'increase' | 'hedge';
  symbol: string;
  name: string;
  reason: string;
  expectedImpact: string;
  confidence: number; // 0-100
}

interface PortfolioAnalysisResult {
  holdings: PortfolioHolding[];
  riskAnalysis: RiskAnalysis;
  marketComparison: MarketComparison;
  suggestions: PortfolioSuggestion[];
}

// Form schema for file upload
const uploadSchema = z.object({
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Please select a file to upload",
  }),
  brokerType: z.string().min(1, "Please select a broker"),
});

export default function PortfolioAnalysisPage() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<PortfolioAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("holdings");
  const [isUploading, setIsUploading] = useState(false);
  
  // Query to get the list of supported brokers
  const { data: brokers = [], isLoading: isBrokersLoading } = useQuery({
    queryKey: ['/api/portfolio/supported-brokers'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/supported-brokers');
      if (!response.ok) {
        throw new Error('Failed to fetch brokers');
      }
      return await response.json();
    }
  });
  
  // Upload form
  const form = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      file: undefined,
      brokerType: "",
    },
  });
  
  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/portfolio/analyze', {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze portfolio');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setActiveTab("holdings");
      toast({
        title: "Portfolio Analysis Complete",
        description: "Your portfolio has been successfully analyzed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze portfolio",
        variant: "destructive",
      });
    }
  });
  
  // Form submission handler
  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    const formData = new FormData();
    formData.append('file', values.file[0]);
    formData.append('brokerType', values.brokerType);
    
    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function to get appropriate color based on performance
  const getPerformanceColor = (value: number) => {
    if (value > 5) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-amber-600";
  };
  
  // Helper function to get risk level color
  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'Low': return "bg-green-100 text-green-800";
      case 'Medium': return "bg-amber-100 text-amber-800";
      case 'High': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Helper function to get suggestion type icon
  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <Plus className="h-4 w-4 text-green-600" />;
      case 'remove': return <X className="h-4 w-4 text-red-600" />;
      case 'reduce': return <Minus className="h-4 w-4 text-amber-600" />;
      case 'increase': return <Plus className="h-4 w-4 text-blue-600" />;
      case 'hedge': return <ShieldAlert className="h-4 w-4 text-purple-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Portfolio Analysis</h1>
      
      {!analysisResult ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Portfolio</CardTitle>
            <CardDescription>
              Upload your portfolio data from one of the supported Indian brokers to get a comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="brokerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Your Broker</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select broker" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isBrokersLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading brokers...
                            </SelectItem>
                          ) : (
                            brokers.map((broker: any) => (
                              <SelectItem 
                                key={broker.id} 
                                value={broker.id}
                                disabled={broker.status === 'coming_soon'}
                              >
                                {broker.name} 
                                {broker.status === 'coming_soon' && " (Coming Soon)"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Portfolio File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.xls,.json,.txt"
                          onChange={(e) => onChange(e.target.files)}
                          {...rest}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload your holdings file exported from your broker. Supported formats: CSV, Excel, JSON, or Text.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      Analyze Portfolio
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">How to export your portfolio:</p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="zerodha">
                  <AccordionTrigger>Zerodha</AccordionTrigger>
                  <AccordionContent>
                    1. Log in to your Zerodha Kite account<br />
                    2. Go to Console → Holdings<br />
                    3. Click on the "Download" button<br />
                    4. Select CSV format and download
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="groww">
                  <AccordionTrigger>Groww</AccordionTrigger>
                  <AccordionContent>
                    1. Log in to your Groww account<br />
                    2. Go to Dashboard → Investments<br />
                    3. Click on "Export" or "Download"<br />
                    4. Select CSV format and download
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="upstox">
                  <AccordionTrigger>Upstox</AccordionTrigger>
                  <AccordionContent>
                    1. Log in to your Upstox account<br />
                    2. Go to Portfolio → Holdings<br />
                    3. Click on the "Export" option<br />
                    4. Select CSV format and download
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setAnalysisResult(null)}>
              Upload New Portfolio
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Analysis
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-8 w-full lg:w-auto">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="market">Market Comparison</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="holdings" className="p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Holdings</CardTitle>
                  <CardDescription>
                    Comprehensive view of your current investments and their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {formatCurrency(analysisResult.holdings.reduce((sum, h) => sum + h.value, 0))}
                          </div>
                          <p className="text-muted-foreground">Total Portfolio Value</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(analysisResult.holdings.reduce((sum, h) => sum + h.pnl, 0))}`}>
                            {formatCurrency(analysisResult.holdings.reduce((sum, h) => sum + h.pnl, 0))}
                          </div>
                          <p className="text-muted-foreground">Total P&L</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getPerformanceColor(analysisResult.marketComparison.portfolioPerformance)}`}>
                            {analysisResult.marketComparison.portfolioPerformance.toFixed(2)}%
                          </div>
                          <p className="text-muted-foreground">Portfolio Return</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Avg. Price</TableHead>
                          <TableHead className="text-right">Current Price</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead className="text-right">P&L</TableHead>
                          <TableHead className="text-right">P&L %</TableHead>
                          <TableHead className="text-right">Allocation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.holdings.map((holding) => (
                          <TableRow key={holding.symbol}>
                            <TableCell className="font-medium">{holding.symbol}</TableCell>
                            <TableCell>{holding.name}</TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100">
                                {holding.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{holding.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(holding.avgPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(holding.value)}</TableCell>
                            <TableCell className={`text-right ${getPerformanceColor(holding.pnl)}`}>
                              {formatCurrency(holding.pnl)}
                            </TableCell>
                            <TableCell className={`text-right ${getPerformanceColor(holding.pnlPercent)}`}>
                              {holding.pnlPercent.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-right">
                              {holding.allocation.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="risk" className="p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis</CardTitle>
                  <CardDescription>
                    Comprehensive analysis of your portfolio's risk metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Overall Risk Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              analysisResult.riskAnalysis.overallRisk === 'Low' 
                                ? 'bg-green-100 text-green-800' 
                                : analysisResult.riskAnalysis.overallRisk === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {analysisResult.riskAnalysis.overallRisk} Risk
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Portfolio Beta</div>
                            <div className="text-xl font-semibold">
                              {analysisResult.riskAnalysis.beta.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Diversification Score</span>
                            <span className="text-sm font-medium">
                              {analysisResult.riskAnalysis.diversificationScore}/100
                            </span>
                          </div>
                          <Progress 
                            value={Number(analysisResult.riskAnalysis.diversificationScore)} 
                            className="h-2"
                          />
                          <p className="mt-2 text-sm text-muted-foreground">
                            {analysisResult.riskAnalysis.diversificationScore > 75 
                              ? "Well-diversified portfolio with good spread across sectors"
                              : analysisResult.riskAnalysis.diversificationScore > 50
                                ? "Moderately diversified, consider adding exposure to more sectors"
                                : "Poorly diversified portfolio, high concentration risk"
                            }
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div>
                            <div className="text-sm text-muted-foreground">Volatility</div>
                            <div className="text-lg font-medium">
                              {analysisResult.riskAnalysis.volatility.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Max Drawdown</div>
                            <div className="text-lg font-medium">
                              {analysisResult.riskAnalysis.maxDrawdown.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                            <div className="text-lg font-medium">
                              {analysisResult.riskAnalysis.sharpeRatio.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <div className="text-sm text-muted-foreground flex items-center">
                                      Correlation 
                                      <HelpCircle className="h-3 w-3 ml-1" />
                                    </div>
                                    <div className="text-lg font-medium">
                                      {analysisResult.riskAnalysis.portfolioCorrelation.toFixed(2)}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-56">
                                    Correlation between your holdings. Lower values indicate better diversification.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Sector Allocation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysisResult.riskAnalysis.sectorConcentration.map((sector) => (
                            <div key={sector.sector}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{sector.sector}</span>
                                <span className="text-sm font-medium">{sector.percentage.toFixed(1)}%</span>
                              </div>
                              <Progress 
                                value={sector.percentage} 
                                className={`h-2 ${sector.percentage > 25 ? 'bg-amber-100' : ''}`}
                              />
                              {sector.percentage > 25 && (
                                <p className="mt-1 text-xs text-amber-600">
                                  High concentration in this sector
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold mb-2">Top Risk Contributors</h4>
                          <div className="space-y-2">
                            {analysisResult.riskAnalysis.riskContributors.map((stock) => (
                              <div key={stock.symbol} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                                <span>{stock.symbol}</span>
                                <span className="font-medium">{stock.contribution.toFixed(1)}% of risk</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Risk Analysis Insights</AlertTitle>
                    <AlertDescription>
                      {analysisResult.riskAnalysis.overallRisk === 'Low' 
                        ? "Your portfolio has a conservative risk profile, suitable for preservation of capital with moderate growth. Consider if this aligns with your investment goals."
                        : analysisResult.riskAnalysis.overallRisk === 'Medium'
                          ? "Your portfolio has a balanced risk profile, suitable for moderate growth. Review sector concentrations to ensure they align with your investment strategy."
                          : "Your portfolio has an aggressive risk profile with higher volatility. Ensure this matches your risk tolerance and investment timeline."
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="market" className="p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Market Comparison</CardTitle>
                  <CardDescription>
                    How your portfolio performs against Indian market benchmarks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Indian Indices Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Your Portfolio</div>
                            <div className={`text-2xl font-semibold ${getPerformanceColor(analysisResult.marketComparison.portfolioPerformance)}`}>
                              {analysisResult.marketComparison.portfolioPerformance.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-4">
                          {analysisResult.marketComparison.indexComparisons.map((index: { indexName: string; indexPerformance: number }) => (
                            <div key={index.indexName} className="bg-muted/30 px-3 py-2 rounded-md">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{index.indexName}</span>
                                <div className={`font-medium ${getPerformanceColor(index.indexPerformance)}`}>
                                  {index.indexPerformance.toFixed(2)}%
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Relative Performance</span>
                                  <span className={
                                    analysisResult.marketComparison.portfolioPerformance >= index.indexPerformance
                                      ? 'text-green-600'
                                      : 'text-red-600'
                                  }>
                                    {analysisResult.marketComparison.portfolioPerformance >= index.indexPerformance
                                      ? `+${(analysisResult.marketComparison.portfolioPerformance - index.indexPerformance).toFixed(2)}%`
                                      : `-${(index.indexPerformance - analysisResult.marketComparison.portfolioPerformance).toFixed(2)}%`
                                    }
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      analysisResult.marketComparison.portfolioPerformance >= index.indexPerformance
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(10, Math.abs(
                                        (analysisResult.marketComparison.portfolioPerformance / Math.max(0.1, index.indexPerformance)) * 100
                                      )))}%`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>Compare your performance against key Indian market indices to understand how your investment strategy is performing in different market segments.</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Sectoral Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysisResult.marketComparison.sectoralIndices.map((sector) => (
                            <div key={sector.sector} className="border rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{sector.sector}</span>
                                <div className="flex items-center space-x-1">
                                  {sector.holdingsPerformance > sector.indexPerformance ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={`text-sm font-medium ${
                                    sector.holdingsPerformance > sector.indexPerformance 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {sector.holdingsPerformance > sector.indexPerformance ? 'Outperforming' : 'Underperforming'}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Your holdings</span>
                                  <div className={`font-medium ${getPerformanceColor(sector.holdingsPerformance)}`}>
                                    {sector.holdingsPerformance.toFixed(2)}%
                                  </div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Sector index</span>
                                  <div className={`font-medium ${getPerformanceColor(sector.indexPerformance)}`}>
                                    {sector.indexPerformance.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Alert className={analysisResult.marketComparison.portfolioPerformance >= analysisResult.marketComparison.nifty50Performance ? "bg-green-50" : "bg-amber-50"}>
                    {analysisResult.marketComparison.portfolioPerformance >= analysisResult.marketComparison.nifty50Performance ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <AlertTitle>
                      {analysisResult.marketComparison.portfolioPerformance >= analysisResult.marketComparison.nifty50Performance 
                        ? "Strong Performance in Indian Markets" 
                        : "Indian Market Performance Alert"}
                    </AlertTitle>
                    <AlertDescription>
                      {analysisResult.marketComparison.portfolioPerformance >= analysisResult.marketComparison.nifty50Performance 
                        ? `Your portfolio is outperforming the Nifty 50 by ${(analysisResult.marketComparison.portfolioPerformance - analysisResult.marketComparison.nifty50Performance).toFixed(2)}%. The strongest performing sectors in your portfolio are ${
                            analysisResult.marketComparison.sectoralIndices
                              .sort((a, b) => b.holdingsPerformance - a.holdingsPerformance)
                              .slice(0, 2)
                              .map(s => s.sector)
                              .join(" and ")
                          }. Your investment strategy is well-aligned with current Indian market conditions.` 
                        : `Your portfolio is underperforming the Nifty 50 by ${(analysisResult.marketComparison.nifty50Performance - analysisResult.marketComparison.portfolioPerformance).toFixed(2)}%. Consider adjusting your exposure to high-performance Indian sectors like ${
                            analysisResult.marketComparison.indexComparisons
                              .filter((idx: { indexName: string; indexPerformance: number }) => idx.indexName.includes('Nifty') && idx.indexPerformance > 10)
                              .slice(0, 2)
                              .map((idx: { indexName: string }) => idx.indexName.replace('Nifty ', ''))
                              .join(" and ")
                          } to potentially improve returns. Review the suggestions tab for specific optimization ideas.`
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="suggestions" className="p-0">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Optimization Suggestions</CardTitle>
                  <CardDescription>
                    Actionable recommendations to improve your portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <Card key={index} className={`
                        ${suggestion.type === 'add' ? 'border-l-4 border-l-green-500' : ''}
                        ${suggestion.type === 'remove' ? 'border-l-4 border-l-red-500' : ''}
                        ${suggestion.type === 'reduce' ? 'border-l-4 border-l-amber-500' : ''}
                        ${suggestion.type === 'increase' ? 'border-l-4 border-l-blue-500' : ''}
                        ${suggestion.type === 'hedge' ? 'border-l-4 border-l-purple-500' : ''}
                      `}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="rounded-full p-2 bg-muted">
                              {getSuggestionTypeIcon(suggestion.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-semibold text-lg capitalize">
                                  {suggestion.type} {suggestion.symbol}
                                </h3>
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground mr-2">Confidence</span>
                                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 font-medium">
                                    {suggestion.confidence}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{suggestion.name}</p>
                              <div className="mt-4 space-y-2">
                                <div>
                                  <span className="text-sm font-medium">Reason:</span>
                                  <p className="text-sm">{suggestion.reason}</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">Expected Impact:</span>
                                  <p className="text-sm">{suggestion.expectedImpact}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Disclaimer</AlertTitle>
                      <AlertDescription className="text-sm">
                        These suggestions are based on historical data and current market conditions. 
                        They should not be considered as financial advice. Always conduct your own research 
                        or consult with a financial advisor before making investment decisions.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}