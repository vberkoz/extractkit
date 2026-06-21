import type { FieldErrors } from "../domain/json";

export class HttpError extends Error {
  statusCode: number;
  code: string;
  fields?: FieldErrors;

  constructor(statusCode: number, code: string, message: string, fields?: FieldErrors) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}
