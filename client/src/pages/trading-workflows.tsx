import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Play, Pause, Plus, Settings, ArrowRight, Check, AlertTriangle, Info, Clock, Save } from "lucide-react";

interface WorkflowLog {
  id: number;
  status: string;
  executedAt: Date;
  message: string;
}

interface TradingWorkflow {
  id: string; // UUID from backend
  userId: string; // UUID from backend
  name: string;
  description?: string; // Optional pointer in backend
  status: "active" | "inactive" | "paused" | "archived";
  isAutomatic: boolean;
  priority: number;
  schedule?: string; // Optional pointer in backend
  executionCount: number;
  lastExecutedAt?: Date; // Optional pointer in backend
  createdAt: Date;
  updatedAt: Date;
  logHistory?: any; // JSON field from backend
}

const workflowFormSchema = z.object({
  name: z.string().min(3, { message: "Workflow name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }).optional(),
  isAutomatic: z.boolean().default(false),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  schedule: z.string().optional(),
  status: z.enum(["active", "inactive", "paused", "archived"]).default("inactive")
});

export default function TradingWorkflows() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<TradingWorkflow | null>(null);
  const [activeTab, setActiveTab] = useState("execution");

  // Fetch all workflows from Go backend
  const { data: workflows, isLoading, error } = useQuery({
    queryKey: ['trading-workflows'],
    queryFn: async () => {
      const response = await apiRequest("GET", "http://localhost:8080/trading-workflows");
      console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    retry: 1
  });

  // Execute workflow mutation (placeholder - implement when backend supports it)
  const executeWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `http://localhost:8080/trading-workflow/${id}/execute`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executing",
        description: "The workflow is now running in the background.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['trading-workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute workflow",
        variant: "destructive"
      });
    }
  });

  // Toggle workflow status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const response = await apiRequest("PUT", `http://localhost:8080/trading-workflow/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The workflow status has been updated.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['trading-workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update workflow status",
        variant: "destructive"
      });
    }
  });

  // Create new workflow form
  const form = useForm<z.infer<typeof workflowFormSchema>>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isAutomatic: false,
      priority: 0,
      schedule: "0 9 * * 1-5", // Default: weekdays at 9 AM
      status: "inactive"
    },
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workflowFormSchema>) => {
      const response = await apiRequest("POST", "http://localhost:8080/trading-workflows", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Created",
        description: "Your trading workflow has been created successfully.",
        variant: "default"
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['trading-workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create workflow",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof workflowFormSchema>) => {
    createWorkflowMutation.mutate(data);
  };

  const [location, navigate] = useLocation();
  
  // Select workflow for details view
  const handleSelectWorkflow = (workflow: TradingWorkflow) => {
    setSelectedWorkflow(workflow);
  };

  // Handle workflow execution
  const handleExecuteWorkflow = (id: string) => {
    executeWorkflowMutation.mutate(id);
  };

  // Handle workflow status toggle
  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  // Format the schedule for display
  const formatSchedule = (schedule?: string) => {
    if (!schedule) return "No schedule";
    
    // Simple CRON formatting - this could be more sophisticated
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;
    
    if (parts[4] === "1-5") {
      return `Weekdays at ${parts[1]}:${parts[0] === "0" ? "00" : parts[0]}`;
    }
    
    return schedule;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "inactive": return "bg-gray-500";
      case "archived": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // Render execution log items
  const renderLogHistory = (logHistory?: any) => {
    if (!logHistory) {
      return <div className="text-center p-4 text-gray-500">No execution history available</div>;
    }

    // Parse JSON if it's a string, otherwise use as is
    let logs;
    try {
      logs = typeof logHistory === 'string' ? JSON.parse(logHistory) : logHistory;
    } catch {
      logs = [];
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      return <div className="text-center p-4 text-gray-500">No execution history available</div>;
    }

    return logs.map((log: any, index: number) => (
      <div key={index} className="p-3 border-b last:border-b-0 flex items-start gap-3">
        <div className={`mt-1 p-1 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {log.status === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div className="font-medium">{log.status === 'success' ? 'Success' : 'Warning'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              {log.executedAt ? new Date(log.executedAt).toLocaleString() : 'Unknown time'}
            </div>
          </div>
          <div className="text-sm mt-1">{log.message || 'No message'}</div>
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading workflows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">Failed to load workflows: {error.message}</div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['trading-workflows'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Trading Workflow Automation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Workflow List */}
        <div className="col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Workflows</h2>
            <Button 
              size="sm" 
              onClick={() => navigate('/create-workflow')}
            >
              <Plus size={16} className="mr-1" /> New Workflow
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-180px)]">
            {workflows && workflows.length > 0 ? (
              <div className="space-y-3">
                {workflows.map((workflow: TradingWorkflow) => (
                  <Card 
                    key={workflow.id} 
                    className={`cursor-pointer hover:bg-accent hover:bg-opacity-50 transition-all ${selectedWorkflow?.id === workflow.id ? 'border-primary' : ''}`}
                    onClick={() => handleSelectWorkflow(workflow)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-md">{workflow.name}</CardTitle>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {workflow.description || "No description"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Schedule:</span>
                          <span>{formatSchedule(workflow.schedule)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Run:</span>
                          <span>{workflow.lastExecutedAt ? new Date(workflow.lastExecutedAt).toLocaleString() : 'Never'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Executions:</span>
                          <span>{workflow.executionCount}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(workflow.id, workflow.status);
                        }}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {workflow.status === "active" ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
                        {workflow.status === "active" ? "Pause" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteWorkflow(workflow.id);
                        }}
                        disabled={executeWorkflowMutation.isPending}
                      >
                        {executeWorkflowMutation.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Play size={14} className="mr-1" />
                        )}
                        Run Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Workflows Found</CardTitle>
                  <CardDescription>
                    Create your first trading workflow to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    Trading workflows allow you to automate your strategies based on market conditions.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/create-workflow')}
                  >
                    <Plus size={16} className="mr-1" /> Create Workflow
                  </Button>
                </CardFooter>
              </Card>
            )}
            <ScrollBar />
          </ScrollArea>
        </div>
        
        {/* Right Column - Workflow Details */}
        <div className="col-span-1 md:col-span-2">
          {selectedWorkflow ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{selectedWorkflow.name}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleStatus(selectedWorkflow.id, selectedWorkflow.status)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {selectedWorkflow.status === "active" ? <Pause size={16} className="mr-1" /> : <Play size={16} className="mr-1" />}
                    {selectedWorkflow.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    onClick={() => handleExecuteWorkflow(selectedWorkflow.id)}
                    disabled={executeWorkflowMutation.isPending}
                  >
                    {executeWorkflowMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play size={16} className="mr-1" />
                    )}
                    Run Now
                  </Button>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-muted p-4 rounded-md">
                  <p className="mb-4">{selectedWorkflow.description || "No description provided"}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className={getStatusColor(selectedWorkflow.status)}>
                        {selectedWorkflow.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Schedule</p>
                      <p>{formatSchedule(selectedWorkflow.schedule)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Priority</p>
                      <p>{selectedWorkflow.priority}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Executions</p>
                      <p>{selectedWorkflow.executionCount}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="execution">Execution History</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="execution">
                  <Card>
                    <CardHeader>
                      <CardTitle>Execution History</CardTitle>
                      <CardDescription>
                        Recent workflow execution logs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {renderLogHistory(selectedWorkflow.logHistory)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Workflow Settings</CardTitle>
                      <CardDescription>
                        Configure your workflow behavior
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormLabel htmlFor="workflowName">Workflow Name</FormLabel>
                            <Input 
                              id="workflowName" 
                              value={selectedWorkflow.name}
                              readOnly 
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel htmlFor="workflowStatus">Status</FormLabel>
                            <Select defaultValue={selectedWorkflow.status}>
                              <SelectTrigger id="workflowStatus">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel htmlFor="workflowDescription">Description</FormLabel>
                          <Textarea 
                            id="workflowDescription" 
                            value={selectedWorkflow.description || ""}
                            readOnly
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          <FormLabel htmlFor="workflowSchedule">Execution Schedule (CRON format)</FormLabel>
                          <Input 
                            id="workflowSchedule" 
                            value={selectedWorkflow.schedule || ""}
                          />
                          <p className="text-xs text-gray-500">
                            Format: minute hour day month weekday (e.g., "0 9 * * 1-5" for weekdays at 9 AM)
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch id="automatic" checked={selectedWorkflow.isAutomatic} />
                          <FormLabel htmlFor="automatic">Automatic Execution</FormLabel>
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel htmlFor="workflowPriority">Priority (0-10)</FormLabel>
                          <Input 
                            id="workflowPriority" 
                            type="number"
                            min={0}
                            max={10}
                            value={selectedWorkflow.priority}
                          />
                          <p className="text-xs text-gray-500">
                            Higher priority workflows will execute first when resources are limited
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline">
                        Cancel
                      </Button>
                      <Button>
                        <Save size={16} className="mr-1" /> Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="h-[calc(100vh-180px)] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mb-2">Select a Workflow</CardTitle>
                <CardDescription>
                  Choose a workflow from the list to view and manage its details
                </CardDescription>
                <div className="mt-6">
                  <Button onClick={() => navigate('/create-workflow')}>
                    <Plus size={16} className="mr-1" /> Create New Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
