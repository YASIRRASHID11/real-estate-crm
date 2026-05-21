"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
}

export function useApi<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      url: string,
      options?: RequestInit & UseApiOptions<T>
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const { onSuccess, onError, successMessage, ...fetchOptions } = options || {};
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
          ...fetchOptions,
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          const msg = json.message || "Something went wrong";
          setError(msg);
          if (onError) onError(msg);
          else toast.error(msg);
          return null;
        }

        setData(json.data);
        if (successMessage) toast.success(successMessage);
        if (onSuccess) onSuccess(json.data);
        return json.data;
      } catch (err) {
        const msg = "Network error. Please try again.";
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, execute };
}

export function useFetch<T = unknown>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (queryUrl?: string) => {
    setLoading(true);
    try {
      const res = await fetch(queryUrl || url);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, error, refetch: fetch_ };
}
