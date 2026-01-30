export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const asApiError = (error: unknown) => {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError(error.message, 500, "INTERNAL_ERROR");
  }
  return new ApiError("Erro inesperado", 500, "INTERNAL_ERROR");
};
