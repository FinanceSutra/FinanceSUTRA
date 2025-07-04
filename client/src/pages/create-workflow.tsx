import React, { useEffect, useState } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";

// Form schema for workflow creation/editing - updated to match backend model
const workflowFormSchema = z.object({
  name: z.string().min(3, { message: "Workflow name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }).optional(),
  isAutomatic: z.boolean().default(false),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  schedule: z.string().optional(),
  status: z.enum(["active", "inactive", "paused", "archived"]).default("inactive")
});

type WorkflowFormValues = z.infer<typeof workflowFormSchema>;

export default function CreateWorkflow() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);

  // Get existing workflow data if editing - updated endpoint
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery({
    queryKey: ['trading-workflows', id],
    queryFn: async () => {
      const response = await apiRequest("GET", `http://localhost:8080/trading-workflow/${id}`);
      return response.json();
    },
    enabled: isEditing,
  });

  // Initialize form with default values
  const form = useForm<WorkflowFormValues>({
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

  // Update form values when workflow data is loaded
  useEffect(() => {
    if (workflow && isEditing) {
      form.reset({
        name: workflow.name || "",
        description: workflow.description || "",
        isAutomatic: workflow.isAutomatic || false,
        priority: workflow.priority || 0,
        schedule: workflow.schedule || "0 9 * * 1-5",
        status: workflow.status || "inactive"
      });
      setIsLoading(false);
    }
  }, [workflow, form, isEditing]);

  // Create workflow mutation - updated endpoint
  const createWorkflowMutation = useMutation({
    mutationFn: async (data: WorkflowFormValues) => {
      const response = await apiRequest("POST", "http://localhost:8080/trading-workflows", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Created",
        description: "Your trading workflow has been created successfully.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['trading-workflows'] });
      navigate("/trading-workflows");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create workflow",
        variant: "destructive"
      });
    }
  });

  // Update workflow mutation - updated endpoint
  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: WorkflowFormValues) => {
      const response = await apiRequest("PUT", `http://localhost:8080/trading-workflow/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow Updated",
        description: "Your trading workflow has been updated successfully.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['trading-workflows'] });
      navigate("/trading-workflows");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update workflow",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: WorkflowFormValues) => {
    if (isEditing) {
      updateWorkflowMutation.mutate(data);
    } else {
      createWorkflowMutation.mutate(data);
    }
  };

  if (isLoading || isLoadingWorkflow) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading workflow data...</span>
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
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Workflow" : "Create New Workflow"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Trading Workflow" : "Create Trading Workflow"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update your automated trading workflow parameters" 
              : "Create a new automated trading workflow to execute your strategies"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="workflow-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SMA Crossover Strategy" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear name that describes what this workflow does
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this workflow does..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about the workflow's purpose and functionality
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Set whether this workflow should be active immediately
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority (0-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={10} {...field} />
                      </FormControl>
                      <FormDescription>
                        Higher priority workflows execute first (10 is highest)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <FormField
                control={form.control}
                name="isAutomatic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                    <div>
                      <FormLabel className="text-base">Automatic Execution</FormLabel>
                      <FormDescription>
                        When enabled, this workflow will run automatically according to the schedule.
                        When disabled, it will only run when manually triggered.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem className={!form.watch("isAutomatic") ? "opacity-50" : ""}>
                    <FormLabel>Execution Schedule (CRON format)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0 9 * * 1-5" 
                        {...field} 
                        disabled={!form.watch("isAutomatic")}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      <p>Format: minute hour day month weekday</p>
                      <p className="text-xs mt-1">Examples:</p>
                      <ul className="text-xs list-disc pl-4 mt-1 space-y-1">
                        <li>"0 9 * * 1-5" - Every weekday at 9:00 AM</li>
                        <li>"0 */4 * * *" - Every 4 hours</li>
                        <li>"0 9,15 * * *" - Every day at 9:00 AM and 3:00 PM</li>
                      </ul>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate("/trading-workflows")}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="workflow-form"
            disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
          >
            {(createWorkflowMutation.isPending || updateWorkflowMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? "Update Workflow" : "Create Workflow"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
