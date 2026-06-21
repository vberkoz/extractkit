import type { FieldErrors, JsonValue } from "./json";

export type SuccessBody = {
  ok: true;
  data: JsonValue;
};

export type ErrorBody = {
  ok: false;
  error: {
    message: string;
    code: string;
    fields?: FieldErrors;
  };
};
