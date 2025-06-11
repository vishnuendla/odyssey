import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>,
    options: UseApiOptions<R> = {}
  ) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage = 'An error occurred. Please try again.',
    } = options;

    try {
      setIsLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result as unknown as T);
      
      if (successMessage) {
        toast({
          description: successMessage,
        });
      }
      
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      
      toast({
        variant: "destructive",
        description: error.message || errorMessage,
      });
      
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
} 