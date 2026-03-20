"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";

type RequestOptions = {
  cacheKey?: string;
  cacheTtlMs?: number;
};

type ClientCacheEntry = {
  expiresAt: number;
  value: unknown;
};

const responseCache = new Map<string, ClientCacheEntry>();

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    let payload: { error?: unknown } | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const error = payload?.error ?? response.statusText;
    throw new Error(
      typeof error === "string" ? error : "Erro inesperado na API",
    );
  }
  return response.json();
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error
      ? error.name === "AbortError" || /abort/i.test(error.message)
      : false;

export function useApi() {
  const { pushToast } = useToast();

  const request = useCallback(
    async <T,>(input: RequestInfo, init?: RequestInit, options?: RequestOptions) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const cacheKey =
        method === "GET" && options?.cacheKey && options.cacheTtlMs
          ? options.cacheKey
          : null;

      if (cacheKey) {
        const cached = responseCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value as T;
        }
      }

      try {
        const response = await fetch(input, init);
        const data = await handleResponse<T>(response);

        if (cacheKey && options?.cacheTtlMs) {
          responseCache.set(cacheKey, {
            value: data,
            expiresAt: Date.now() + options.cacheTtlMs,
          });
        }

        return data;
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }

        const message =
          error instanceof Error ? error.message : "Erro inesperado";
        pushToast({
          title: "Erro",
          description: message,
          variant: "error",
        });
        throw error;
      }
    },
    [pushToast],
  );

  const uploadWithProgress = useCallback(
    <T,>(
      url: string,
      formData: FormData,
      onProgress: (percent: number) => void,
    ) => {
      return new Promise<T>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      }).catch((error) => {
        const message =
          error instanceof Error ? error.message : "Erro inesperado";
        pushToast({
          title: "Erro",
          description: message,
          variant: "error",
        });
        throw error;
      });
    },
    [pushToast],
  );

  return { request, uploadWithProgress };
}
