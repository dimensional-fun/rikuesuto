import type { RequestData } from "../Request";

export enum Method {
  GET = "get",
  POST = "post",
  DELETE = "delete",
  PATCH = "patch",
  PUT = "put",
  HEAD = "head",
  OPTIONS = "options",
  CONNECT = "connect",
  TRACE = "trace"
}
export const defaultRequestOptions: RequestData = {
  headers: {},
  query: {},
  method: Method.GET,
  body: null,
  follow: false,
  compressData: false
}
