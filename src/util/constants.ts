import type { RequestData } from "../Request";

export const defaultRequestOptions: RequestData = {
  headers: {},
  query: {},
  method: "get",
  body: null,
  follow: false,
  compressData: false
}
