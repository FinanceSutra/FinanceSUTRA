import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Lightbulb, 
  RefreshCw, 
  CheckCircle2, 
  Settings, 
  Key, 
  Database, 
  Code, 
  Network, 
  Cpu 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { checkSecrets, openAPIKeyCheck, perplexityAPIKeyCheck, checkAIServices } from '@/lib/api-helpers';

export type ErrorType = 
  | 'api_key_missing' 
  | 'api_key_invalid' 
  | 'server_error' 
  | 'timeout' 
  | 'preferences_invalid' 
  | 'unknown';

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  timestamp: Date;
  retryCount: number;
  statusCode?: number;
  errorCode?: string;
}

interface ErrorRecoveryWizardProps {
  error: ErrorDetails | null;
  onRetry: () => void;
  onReset: () => void;
  onClose: () => void;
  isAPIKeyConfigured: boolean;
}

const ErrorRecoveryWizard: React.FC<ErrorRecoveryWizardProps> = ({
  error,
  onRetry,
  onReset,
  onClose,
  isAPIKeyConfigured
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('diagnose');

  if (!error) return null;

  // Get relevant error information
  const {type, message, timestamp, retryCount} = error;
  
  // Generate guidance based on error type
  const getGuidance = () => {
    switch (type) {
      case 'api_key_missing':
        return {
          title: 'AI API Key Not Configured',
          description: 'AI-powered recommendations require either an OpenAI API key or a Perplexity API key to generate personalized strategies.',
          steps: [
            'Configure either an OpenAI API key or a Perplexity API key (free alternative)',
            'Check environment variables configuration on the server',
            'Once configured, try generating recommendations again'
          ],
          icon: <Key className="h-5 w-5" />,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-900'
        };
      
      case 'api_key_invalid':
        return {
          title: 'Invalid AI API Key',
          description: 'The configured API key was rejected. It may be invalid or have reached its usage limit.',
          steps: [
            'Verify the API key is correctly entered without extra spaces',
            'Check if the key has billing issues or rate limits',
            'Try using a Perplexity API key instead of OpenAI (free alternative)',
            'Contact your administrator to update the API key'
          ],
          icon: <Key className="h-5 w-5" />,
          color: 'bg-red-50 border-red-200 text-red-900'
        };
      
      case 'server_error':
        return {
          title: 'Server Error Occurred',
          description: 'The recommendation service encountered an internal error.',
          steps: [
            'Wait a few minutes and try again',
            'Check if the AI service is experiencing downtime',
            'Contact support if the issue persists'
          ],
          icon: <Database className="h-5 w-5" />,
          color: 'bg-orange-50 border-orange-200 text-orange-900'
        };
      
      case 'timeout':
        return {
          title: 'Request Timeout',
          description: 'The recommendation generation is taking longer than expected.',
          steps: [
            'Try again with simpler preferences',
            'Check your network connection',
            'The server might be under heavy load, try again later'
          ],
          icon: <Network className="h-5 w-5" />,
          color: 'bg-blue-50 border-blue-200 text-blue-900'
        };
      
      case 'preferences_invalid':
        return {
          title: 'Invalid Preferences',
          description: 'Your preference settings could not be properly processed.',
          steps: [
            'Reset your preferences to default values',
            'Ensure all required fields are completed',
            'Try with a different combination of preferences'
          ],
          icon: <Settings className="h-5 w-5" />,
          color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
        };
      
      default:
        return {
          title: 'Unknown Error',
          description: 'An unexpected error occurred while generating recommendations.',
          steps: [
            'Try refreshing the page',
            'Reset your preferences and try again',
            'Contact support if the issue persists'
          ],
          icon: <Cpu className="h-5 w-5" />,
          color: 'bg-neutral-50 border-neutral-200 text-neutral-900'
        };
    }
  };

  const guidance = getGuidance();

  // Function to check all AI API keys
  const checkAPIKey = async () => {
    try {
      toast({
        title: "Checking API Keys",
        description: "Verifying AI service configuration...",
      });
      
      const aiServices = await checkAIServices();
      
      if (aiServices.anyServiceAvailable) {
        toast({
          title: "AI Service Available",
          description: `${aiServices.openAI ? 'OpenAI' : ''}${aiServices.openAI && aiServices.perplexity ? ' and ' : ''}${aiServices.perplexity ? 'Perplexity' : ''} API key is configured.`,
        });
      } else {
        toast({
          title: "No AI Services Configured",
          description: "Neither OpenAI nor Perplexity API keys are configured. Consider setting up at least one.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check API key status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className={`${guidance.color}`}>
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 mt-0.5 mr-2 text-red-600" />
          <div>
            <CardTitle className="text-lg">{guidance.title}</CardTitle>
            <CardDescription className="mt-1 text-sm font-medium text-neutral-700">
              {guidance.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TabsTrigger value="diagnose">Diagnose</TabsTrigger>
          <TabsTrigger value="fix">Fix</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>
        
        <TabsContent value="diagnose" className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Error Details</h4>
              <div className="p-3 bg-neutral-50 rounded-md border text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-neutral-500">Type:</span>
                  <span className="font-medium">{type.replace('_', ' ')}</span>
                  
                  <span className="text-neutral-500">Time:</span>
                  <span>{timestamp.toLocaleTimeString()}</span>
                  
                  <span className="text-neutral-500">Retry Count:</span>
                  <span>{retryCount}</span>
                  
                  {error.statusCode && (
                    <>
                      <span className="text-neutral-500">Status Code:</span>
                      <span>{error.statusCode}</span>
                    </>
                  )}
                  
                  {error.errorCode && (
                    <>
                      <span className="text-neutral-500">Error Code:</span>
                      <span>{error.errorCode}</span>
                    </>
                  )}
                </div>
                
                <div className="mt-2 pt-2 border-t">
                  <span className="text-neutral-500 block mb-1">Message:</span>
                  <div className="break-words">{message}</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <div>
                <Badge variant="outline" className="mr-2">
                  {isAPIKeyConfigured ? 'API Key Configured' : 'API Key Missing'}
                </Badge>
                {retryCount > 2 && (
                  <Badge variant="destructive">Multiple Failures</Badge>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={checkAPIKey}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check API Configuration
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="fix" className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Suggested Steps</h4>
              <ol className="space-y-2 list-decimal list-inside text-sm">
                {guidance.steps.map((step, index) => (
                  <li key={index} className="text-neutral-700">{step}</li>
                ))}
              </ol>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription className="text-sm text-blue-700">
                Even if AI-powered recommendations are unavailable, you'll still receive templated strategies 
                based on your preferences using our rule-based matching system.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                <Settings className="h-4 w-4 mr-2" />
                Reset Preferences
              </Button>
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="alternatives" className="p-4">
          <div className="space-y-4">
            <p className="text-sm text-neutral-700">
              If you're having issues with the OpenAI API key, you have several options:
            </p>
            
            <Alert className="bg-green-50 border-green-200 mb-4">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <AlertTitle>Free AI Alternative Available</AlertTitle>
              <AlertDescription className="text-sm text-green-700">
                You can use the Perplexity API as a free alternative to OpenAI for generating AI-powered trading strategy recommendations.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">How to get a Perplexity API Key:</h4>
              <ol className="list-decimal list-inside text-sm space-y-1">
                <li>Visit <a href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Perplexity.ai</a> and create a free account</li>
                <li>Navigate to your account settings and generate an API key</li>
                <li>Add the API key to your environment as <code className="px-1 py-0.5 bg-neutral-100 rounded text-xs">PERPLEXITY_API_KEY</code></li>
                <li>Restart the application to apply changes</li>
              </ol>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-neutral-700 mb-3">
                Other available options if you don't want to use any AI service:
              </p>
            
              <div className="grid gap-3">
                <Card className="p-3 hover:bg-neutral-50 transition-colors cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-green-100 rounded-full mr-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">Continue with Traditional Recommendations</h5>
                      <p className="text-xs text-neutral-600 mt-1">
                        Our system will provide rule-based recommendations matching your preferences.
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3 hover:bg-neutral-50 transition-colors cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-full mr-3">
                      <Code className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">Use Pre-built Strategy Templates</h5>
                      <p className="text-xs text-neutral-600 mt-1">
                        Explore our library of pre-built strategy templates in the Strategy Editor.
                      </p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3 hover:bg-neutral-50 transition-colors cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1.5 bg-purple-100 rounded-full mr-3">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">Create Custom Strategy</h5>
                      <p className="text-xs text-neutral-600 mt-1">
                        Build your own trading strategy from scratch in our advanced editor.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-4 border-t bg-neutral-50">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button size="sm" onClick={() => {
          onRetry();
          toast({
            title: "Regenerating Recommendations",
            description: "Attempting to generate recommendations again...",
          });
        }}>
          Regenerate Recommendations
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ErrorRecoveryWizard;