export type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T | null;
};

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
