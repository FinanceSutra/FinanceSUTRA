import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Pencil, Trash2, Play, Pause, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Strategy } from '@shared/schema';
import Header from '@/components/layout/Header';

const Strategies: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Fetch strategies
  const { data: strategies, isLoading } = useQuery({
    queryKey: ['/api/strategies'],
    staleTime: 60000, // 1 minute
  });

  // Create delete strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/strategies/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Strategy deleted",
        description: "The strategy has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      setSelectedStrategy(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete strategy: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Create toggle strategy active status mutation
  const toggleStrategyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest('PUT', `/api/strategies/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Strategy updated",
        description: "The strategy status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update strategy: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Filter strategies based on search term
  const filteredStrategies = strategies
    ? strategies.filter((strategy: Strategy) => {
        return (
          strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle toggle strategy active status
  const handleToggleActive = (strategy: Strategy) => {
    toggleStrategyMutation.mutate({
      id: strategy.id,
      isActive: !strategy.isActive,
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
        <Header 
          title="Strategies"
          description="Manage your trading strategies"
          actions={
            <Link href="/strategies/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Strategy
              </Button>
            </Link>
          }
        />
        <div className="mt-8 flex justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
      {/* Header */}
      <Header 
        title="Strategies"
        description="Manage your trading strategies"
        actions={
          <Link href="/strategies/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Strategy
            </Button>
          </Link>
        }
      />

      {/* Search and filter */}
      <div className="my-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg 
              className="h-5 w-5 text-neutral-400" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <Input
            type="text"
            placeholder="Search strategies..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Strategy list */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStrategies.length > 0 ? (
          filteredStrategies.map((strategy: Strategy) => (
            <Card key={strategy.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{strategy.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {strategy.symbol} • {strategy.timeframe}
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">
                      {strategy.description || "No description provided"}
                    </p>
                  </div>
                  <Badge variant={strategy.isActive ? "success" : "secondary"}>
                    {strategy.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-neutral-600 mr-2">Run</span>
                    <Switch
                      checked={strategy.isActive}
                      onCheckedChange={() => handleToggleActive(strategy)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/strategies/editor/${strategy.id}`}>
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-danger hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the strategy "{strategy.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteStrategyMutation.mutate(strategy.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Created</span>
                    <time className="text-neutral-700">{new Date(strategy.createdAt).toLocaleDateString()}</time>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-neutral-500">Last updated</span>
                    <time className="text-neutral-700">{new Date(strategy.updatedAt).toLocaleDateString()}</time>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-8 text-center">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
              <Info className="h-6 w-6 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900">No strategies found</h3>
            <p className="mt-2 text-neutral-500">
              {searchTerm
                ? "No strategies match your search criteria"
                : "Get started by creating your first trading strategy"}
            </p>
            {!searchTerm && (
              <Link href="/strategies/create">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Strategy
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Strategies;
