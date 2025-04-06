import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreVertical, Play, Pause, Archive, AlertTriangle, Plus } from "lucide-react";

type DeployedStrategy = {
  id: number;
  name: string;
  strategyId: number;
  brokerId: number;
  userId: number;
  lotMultiplier: string;
  capitalDeployed: string;
  tradingType: string;
  status: string;
  currentPnl: string;
  percentPnl: string;
  deployedAt: string;
  lastUpdated: string;
};

export default function DeployedStrategiesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const { data: deployedStrategies, isLoading } = useQuery({
    queryKey: ['/api/deployed-strategies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/deployed-strategies');
      return await response.json() as DeployedStrategy[];
    },
  });

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
    switch (status) {
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
    switch (type) {
      case "live":
        return <Badge className="bg-purple-600">Live Trading</Badge>;
      case "paper":
        return <Badge variant="outline" className="border-blue-400 text-blue-400">Paper Trading</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num);
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Deployed Strategies</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => navigate("/deploy-strategy")}
        >
          <Plus className="h-4 w-4" />
          Deploy New Strategy
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Active Deployments</CardTitle>
          <CardDescription>
            Manage and monitor your trading strategies deployed with connected brokers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : deployedStrategies && deployedStrategies.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trading Type</TableHead>
                    <TableHead>Capital</TableHead>
                    <TableHead>Current P&L</TableHead>
                    <TableHead>Return %</TableHead>
                    <TableHead>Deployed On</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployedStrategies.map((strategy) => (
                    <TableRow key={strategy.id}>
                      <TableCell className="font-medium">{strategy.name}</TableCell>
                      <TableCell>{getStatusBadge(strategy.status)}</TableCell>
                      <TableCell>{getTradingTypeBadge(strategy.tradingType)}</TableCell>
                      <TableCell>{formatCurrency(strategy.capitalDeployed)}</TableCell>
                      <TableCell className={`${parseFloat(strategy.currentPnl) >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {formatCurrency(strategy.currentPnl)}
                      </TableCell>
                      <TableCell className={`${parseFloat(strategy.percentPnl) >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {formatPercentage(strategy.percentPnl)}
                      </TableCell>
                      <TableCell>{formatDate(strategy.deployedAt)}</TableCell>
                      <TableCell>{formatDate(strategy.lastUpdated)}</TableCell>
                      <TableCell>
                        {isUpdating === strategy.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        ) : (
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
                              {strategy.status === "active" ? (
                                <DropdownMenuItem onClick={() => updateStatus(strategy.id, "paused")}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  <span>Pause Strategy</span>
                                </DropdownMenuItem>
                              ) : strategy.status === "paused" || strategy.status === "error" ? (
                                <DropdownMenuItem onClick={() => updateStatus(strategy.id, "active")}>
                                  <Play className="mr-2 h-4 w-4" />
                                  <span>Activate Strategy</span>
                                </DropdownMenuItem>
                              ) : null}
                              {(strategy.status === "active" || strategy.status === "paused") && (
                                <DropdownMenuItem onClick={() => updateStatus(strategy.id, "archived")}>
                                  <Archive className="mr-2 h-4 w-4" />
                                  <span>Archive Strategy</span>
                                </DropdownMenuItem>
                              )}
                              {strategy.status === "error" && (
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => {
                                    toast({
                                      title: "Strategy Error",
                                      description: "This strategy has encountered an error during execution. Please check logs for details.",
                                      variant: "destructive",
                                    });
                                  }}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  <span>View Error</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
}