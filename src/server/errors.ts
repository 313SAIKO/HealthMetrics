export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function invalidInput(fields?: Record<string, string>): never {
  throw new ApiError(
    400,
    "VALIDATION_ERROR",
    "Check the submitted values.",
    fields,
  );
}
