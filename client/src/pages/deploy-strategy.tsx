import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
  strategyId: z.string().min(1, "Strategy is required"),
  brokerId: z.string().min(1, "Broker is required"),
  name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
  lotMultiplier: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  capitalDeployed: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  tradingType: z.enum(["paper", "live"]),
});

type FormValues = z.infer<typeof formSchema>;

type Strategy = {
  id: number;
  name: string;
  description: string | null;
};

type BrokerConnection = {
  id: number;
  broker: string;
  accountName: string | null;
  environment: string;
};

export default function DeployStrategyPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lotMultiplier: "1",
      capitalDeployed: "10000",
      tradingType: "paper",
    },
  });

  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ['/api/strategies'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/strategies');
      return await response.json() as Strategy[];
    }
  });

  const { data: brokerConnections, isLoading: isLoadingBrokers } = useQuery({
    queryKey: ['/api/broker-connections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/broker-connections');
      return await response.json() as BrokerConnection[];
    }
  });

  const deployStrategyMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deployed-strategies', data),
    onSuccess: () => {
      toast({
        title: "Strategy Deployed",
        description: "Your strategy has been deployed successfully.",
      });
      navigate("/deployed-strategies");
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
      setIsDeploying(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsDeploying(true);
    
    const formattedData = {
      ...data,
      strategyId: parseInt(data.strategyId),
      brokerId: parseInt(data.brokerId),
    };

    deployStrategyMutation.mutate(formattedData);
  };

  const isLoading = isLoadingStrategies || isLoadingBrokers;

  const renderStrategyOptions = () => {
    if (!strategies || strategies.length === 0) {
      return <SelectItem value="no-strategies" disabled>No strategies available</SelectItem>;
    }

    return strategies.map((strategy) => (
      <SelectItem key={strategy.id} value={strategy.id.toString()}>
        {strategy.name}
      </SelectItem>
    ));
  };

  const renderBrokerOptions = () => {
    if (!brokerConnections || brokerConnections.length === 0) {
      return <SelectItem value="no-brokers" disabled>No broker connections available</SelectItem>;
    }

    return brokerConnections.map((connection) => (
      <SelectItem key={connection.id} value={connection.id.toString()}>
        {connection.broker} ({connection.environment}) {connection.accountName ? `- ${connection.accountName}` : ''}
      </SelectItem>
    ));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2 mb-4"
          onClick={() => navigate("/deployed-strategies")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deployed Strategies
        </Button>
        <h1 className="text-3xl font-bold">Deploy Strategy</h1>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Strategy Deployment</CardTitle>
          <CardDescription>
            Configure your strategy deployment settings. Paper trading is risk-free and uses simulated money.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="strategyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strategy</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!strategies || strategies.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{renderStrategyOptions()}</SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the strategy you want to deploy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brokerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!brokerConnections || brokerConnections.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a broker" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{renderBrokerOptions()}</SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which broker to use for this deployment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deployment Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My Strategy Deployment" />
                      </FormControl>
                      <FormDescription>
                        Give your deployment a unique name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lotMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot Multiplier</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0.1" step="0.1" />
                        </FormControl>
                        <FormDescription>
                          Position size multiplier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capitalDeployed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="100" />
                        </FormControl>
                        <FormDescription>
                          Amount of capital to deploy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tradingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trading mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paper">Paper Trading</SelectItem>
                          <SelectItem value="live">Live Trading</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Paper trading uses simulated money
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/deployed-strategies")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isDeploying ||
                      !strategies ||
                      strategies.length === 0 ||
                      !brokerConnections ||
                      brokerConnections.length === 0
                    }
                  >
                    {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Deploy Strategy
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-4">
          <div>
            {!strategies || strategies.length === 0 ? (
              <p className="text-sm text-yellow-600">
                You need to create a strategy before deploying.
              </p>
            ) : null}
            {!brokerConnections || brokerConnections.length === 0 ? (
              <p className="text-sm text-yellow-600">
                You need to connect a broker before deploying.
              </p>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}