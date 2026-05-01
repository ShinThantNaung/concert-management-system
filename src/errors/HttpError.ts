export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message?: string, code?: string) {
    super(message ?? "Server Error");
    this.status = status;
    this.code = code ?? `ERR_${status}`;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}
