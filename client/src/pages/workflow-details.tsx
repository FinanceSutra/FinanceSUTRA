import React, { useState } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  Clock, 
  Edit, 
  Loader2, 
  Play, 
  Plus, 
  Save, 
  Trash 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkflowStep {
  id: number;
  workflowId: number;
  name: string;
  order: number;
  type: string;
  description: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowLog {
  id: number;
  status: string;
  executedAt: Date;
  message: string;
}

interface TradingWorkflow {
  id: number;
  userId: number;
  name: string;
  description: string;
  status: "active" | "inactive" | "paused" | "archived";
  isAutomatic: boolean;
  priority: number;
  schedule?: string;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  logHistory: WorkflowLog[];
}

const stepFormSchema = z.object({
  name: z.string().min(3, { message: "Step name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  type: z.enum(["indicator", "condition", "action"]),
  config: z.object({}).passthrough(),
});

export default function WorkflowDetails() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("steps");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch workflow data
  const { data: workflow, isLoading: isLoadingWorkflow, error } = useQuery({
    queryKey: ['/api/workflows', id],
    retry: 1,
  });

  // Fetch workflow steps
  const { data: workflowSteps = [], isLoading: isLoadingSteps } = useQuery({
    queryKey: ['/api/workflows', id, 'steps'],
    enabled: !!id,
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/workflows/${id}/execute`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executing",
        description: "The workflow is now running in the background.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', id] });
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
    mutationFn: async (status: string) => {
      const response = await apiRequest("POST", `/api/workflows/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "The workflow status has been updated.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', id] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update workflow status",
        variant: "destructive"
      });
    }
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/workflows/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Deleted",
        description: "The workflow has been deleted successfully.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      navigate("/trading-workflows");
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete workflow",
        variant: "destructive"
      });
    }
  });

  // Handle workflow execution
  const handleExecuteWorkflow = () => {
    executeWorkflowMutation.mutate();
  };

  // Handle workflow status toggle
  const handleToggleStatus = (currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    toggleStatusMutation.mutate(newStatus);
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = () => {
    setIsDeleteDialogOpen(true);
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

  // Render a step card
  const renderStep = (step: WorkflowStep, index: number) => {
    return (
      <Card key={step.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-md font-medium">
                {index + 1}. {step.name}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
            <Badge variant={
              step.type === "indicator" ? "outline" : 
              step.type === "condition" ? "secondary" : 
              "default"
            }>
              {step.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            {Object.entries(step.config).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 mb-1">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" className="ml-auto">
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit Step
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // Render execution log items
  const renderLogHistory = (logs: WorkflowLog[]) => {
    if (!logs || logs.length === 0) {
      return <div className="text-center p-4 text-gray-500">No execution history available</div>;
    }

    return logs.map((log) => (
      <div key={log.id} className="p-3 border-b last:border-b-0 flex items-start gap-3">
        <div className={`mt-1 p-1 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {log.status === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <div className="font-medium">{log.status === 'success' ? 'Success' : 'Warning'}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              {new Date(log.executedAt).toLocaleString()}
            </div>
          </div>
          <div className="text-sm mt-1">{log.message}</div>
        </div>
      </div>
    ));
  };

  if (isLoadingWorkflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading workflow details...</span>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">Failed to load workflow details</div>
        <Button onClick={() => navigate("/trading-workflows")}>
          Return to Workflows
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/trading-workflows")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workflows
        </Button>
        <h1 className="text-2xl font-bold">Workflow Details</h1>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{workflow.name}</CardTitle>
                <CardDescription>{workflow.description}</CardDescription>
              </div>
              <Badge className={getStatusColor(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Schedule</p>
                <p>{formatSchedule(workflow.schedule)}</p>
              </div>
              <div>
                <p className="text-gray-500">Priority</p>
                <p>{workflow.priority}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Run</p>
                <p>{workflow.lastExecutedAt ? new Date(workflow.lastExecutedAt).toLocaleString() : 'Never'}</p>
              </div>
              <div>
                <p className="text-gray-500">Executions</p>
                <p>{workflow.executionCount}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStatus(workflow.status)}
              disabled={toggleStatusMutation.isPending}
            >
              {workflow.status === "active" ? "Pause Workflow" : "Activate Workflow"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/edit-workflow/${workflow.id}`)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteWorkflow}
              disabled={executeWorkflowMutation.isPending}
              className="gap-1"
            >
              {executeWorkflowMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run Now
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="execution">Execution History</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="steps">
          {isLoadingSteps ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : Array.isArray(workflowSteps) && workflowSteps.length > 0 ? (
            <div className="space-y-2">
              {workflowSteps.map((step: WorkflowStep, index: number) => renderStep(step, index))}
              <Button className="mt-4" variant="outline">
                <Plus size={16} className="mr-1" /> Add Step
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Steps Defined</CardTitle>
                <CardDescription>
                  This workflow doesn't have any steps yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Steps define the sequence of operations that your workflow will perform.
                  Each step can check indicators, apply conditions, or perform actions.
                </p>
                <Button>
                  <Plus size={16} className="mr-1" /> Add First Step
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="execution">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Recent workflow execution logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderLogHistory(workflow.logHistory)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Destructive actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Deleting this workflow will permanently remove all its configurations, steps, and execution history.
                This action cannot be undone.
              </p>
              <Button 
                variant="destructive" 
                onClick={handleDeleteWorkflow}
                disabled={deleteWorkflowMutation.isPending}
              >
                {deleteWorkflowMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-4 w-4" />
                )}
                Delete Workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              <span className="font-medium"> {workflow.name} </span> 
              workflow and all its associated steps and execution history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteWorkflowMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteWorkflowMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}