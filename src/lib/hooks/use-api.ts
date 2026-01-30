"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";

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

export function useApi() {
  const { pushToast } = useToast();

  const request = useCallback(
    async <T,>(input: RequestInfo, init?: RequestInit) => {
      try {
        const response = await fetch(input, init);
        return await handleResponse<T>(response);
      } catch (error) {
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
    (
      url: string,
      formData: FormData,
      onProgress: (percent: number) => void,
    ) => {
      return new Promise<any>((resolve, reject) => {
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
