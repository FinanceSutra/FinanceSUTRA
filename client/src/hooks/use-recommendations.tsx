import React, { ReactNode, createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ErrorDetails, ErrorType } from '@/components/recommendation/error-recovery-wizard';
import { classifyAPIError, openAPIKeyCheck, perplexityAPIKeyCheck, checkAIServices } from '@/lib/api-helpers';

interface UserPreference {
  riskTolerance: number; // 1-5 scale
  investmentHorizon: string; // short, medium, long
  preferredMarkets: string[]; // forex, stocks, crypto, etc.
  tradingFrequency: string; // day, swing, position
  capitalAvailable: number; // amount in USD
  automationLevel: string; // fully automated, semi-automated, manual
  preferredIndicators: string[]; // moving averages, RSI, MACD, etc.
}

interface StrategyRecommendation {
  id: number;
  name: string;
  description: string;
  matchScore: number;
  riskLevel: number;
  expectedReturn: string;
  timeFrame: string;
  suitableMarkets: string[];
  keyIndicators: string[];
  tradeFrequency: string;
  backtestPerformance: {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  complexity: number;
  code: string;
  userId: number;
  isFavorite: boolean;
  isApplied: boolean;
  createdAt: Date;
}

interface RecommendationsContextType {
  recommendations: StrategyRecommendation[];
  isLoading: boolean;
  error: ErrorDetails | null;
  isAPIKeyConfigured: boolean;
  aiServices: {
    openAI: boolean;
    perplexity: boolean;
    anyServiceAvailable: boolean;
  } | null;
  fetchRecommendationsWithPreferences: (preferences: UserPreference) => Promise<void>;
  resetRecommendations: () => void;
  markAsFavorite: (recommendationId: number) => void;
  markAsApplied: (recommendationId: number) => void;
  deleteRecommendation: (recommendationId: number) => void;
  retryRecommendations: () => void;
  resetError: () => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | null>(null);



export const RecommendationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userPreferences, setUserPreferences] = useState<UserPreference | null>(null);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAPIKeyConfigured, setIsAPIKeyConfigured] = useState<boolean>(false);
  const [aiServices, setAIServices] = useState<{
    openAI: boolean;
    perplexity: boolean;
    anyServiceAvailable: boolean;
  } | null>(null);
  
  // Check AI service availability (OpenAI or Perplexity)
  React.useEffect(() => {
    const checkAIServicesAvailability = async () => {
      try {
        const services = await checkAIServices();
        setIsAPIKeyConfigured(services.anyServiceAvailable);
        setAIServices(services);
      } catch (error) {
        console.error("Error checking AI services:", error);
        setIsAPIKeyConfigured(false);
        setAIServices({
          openAI: false,
          perplexity: false,
          anyServiceAvailable: false
        });
      }
    };
    
    checkAIServicesAvailability();
  }, []);
  
  // Fetch recommendations
  const { data: recommendations = [], isLoading, isError, error: queryError } = useQuery({
    queryKey: ['/api/strategy-recommendations', userPreferences],
    queryFn: async () => {
      if (!userPreferences) return [];
      
      try {
        const res = await apiRequest('POST', '/api/strategy-recommendations', { preferences: userPreferences });
        return await res.json();
      } catch (error: any) {
        // Classify the error
        const { type, message } = classifyAPIError(
          error?.message || "Failed to fetch recommendations", 
          error?.status
        );
        
        // Set detailed error information
        setError({
          type,
          message,
          timestamp: new Date(),
          retryCount,
          statusCode: error?.status,
          errorCode: error?.code
        });
        
        throw error;
      }
    },
    enabled: !!userPreferences,
    retry: false // We'll handle retries manually with the retry button
  });
  
  // Mutations for recommendation actions
  const favoriteRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      await apiRequest('POST', `/api/strategy-recommendations/${recommendationId}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-recommendations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark as favorite",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const applyRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      await apiRequest('POST', `/api/strategy-recommendations/${recommendationId}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-recommendations'] });
      toast({
        title: "Strategy Applied",
        description: "The strategy has been applied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to apply strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deleteRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: number) => {
      await apiRequest('DELETE', `/api/strategy-recommendations/${recommendationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-recommendations'] });
      toast({
        title: "Recommendation Deleted",
        description: "The recommendation has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete recommendation",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Function to fetch recommendations with user preferences
  const fetchRecommendationsWithPreferences = async (preferences: UserPreference) => {
    try {
      console.log("Processing preferences:", preferences);
      
      // Make sure we have valid data
      const validatedPreferences = {
        riskTolerance: preferences.riskTolerance || 3,
        investmentHorizon: preferences.investmentHorizon || 'medium',
        preferredMarkets: preferences.preferredMarkets?.length ? preferences.preferredMarkets : ['stocks', 'options'],
        tradingFrequency: preferences.tradingFrequency || 'swing',
        capitalAvailable: preferences.capitalAvailable || 100000,
        automationLevel: preferences.automationLevel || 'semi-automated',
        preferredIndicators: preferences.preferredIndicators?.length ? preferences.preferredIndicators : ['moving_averages', 'rsi', 'macd']
      };
      
      console.log("Using validated preferences:", validatedPreferences);
      setUserPreferences(validatedPreferences);
      setError(null);
    } catch (error) {
      console.error("Error validating preferences:", error);
      throw error;
    }
  };
  
  // Function to reset recommendations
  const resetRecommendations = () => {
    setUserPreferences(null);
    setError(null);
    setRetryCount(0);
    queryClient.removeQueries({ queryKey: ['/api/strategy-recommendations'] });
  };
  
  // Function to retry recommendations
  const retryRecommendations = () => {
    if (userPreferences) {
      setRetryCount(count => count + 1);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-recommendations'] });
    }
  };
  
  // Function to reset error
  const resetError = () => {
    setError(null);
  };
  
  return (
    <RecommendationsContext.Provider
      value={{
        recommendations,
        isLoading,
        error,
        isAPIKeyConfigured,
        aiServices,
        fetchRecommendationsWithPreferences,
        resetRecommendations,
        markAsFavorite: (recommendationId) => favoriteRecommendationMutation.mutate(recommendationId),
        markAsApplied: (recommendationId) => applyRecommendationMutation.mutate(recommendationId),
        deleteRecommendation: (recommendationId) => deleteRecommendationMutation.mutate(recommendationId),
        retryRecommendations,
        resetError
      }}
    >
      {children}
    </RecommendationsContext.Provider>
  );
};

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};