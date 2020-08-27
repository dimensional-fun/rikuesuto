import type * as https from "https";
import type * as http from "http";
import type { Readable } from "stream";
import type { URL, URLSearchParams } from "url";
import type { AbortController } from "abort-controller";
import type { EventEmitter } from "events";

export class TimeoutError extends Error {
  /**
   * The URL
   */
  readonly url: URL;

  /**
   * @param url
   */
  constructor(url: string);
}

export class HttpError extends Error {
  /**
   * The status code.
   */
  readonly statusCode: number;

  /**
   * The URL, if any.
   */
  readonly url?: URL;

  /**
   * @param code
   * @param message
   * @param url
   */
  constructor(code: number, message: string, url?: string);
}

export class Blob {
  /**
   * The content of the blob consists of the concatenation of the values given in the parts array.
   * @param parts The parts to concat.
   * @param type The type of blob data.
   */
  constructor(parts: BlobParts, type?: string);

  /**
   * The size of this blob in bytes..
   */
  get size(): number;

  /**
   * The type property of this blob.
   */
  get type(): string;

  /**
   * Returns a new blob which contains data from a subset of this blob.
   * @param start
   * @param end
   * @param type
   */
  slice(start?: number, end?: number, type?: string): Blob;

  /**
   * Returns a readable stream.
   */
  stream(): Readable;

  /**
   * The contents of this blob as text.
   */
  text(): Promise<string>;
  
  /**
   * The contents of the blob as binary data contained in an array buffer.
   */
  data(): Promise<ArrayBuffer>;
}

type BlobParts = (ArrayBufferLike | ArrayBufferView | Blob | Buffer | string)[];

export const defaultRequestOptions: RequestData;

export class Request<T = unknown> {
  /**
   * The URL to request.
   */
  url: URL;

  /**
   * The redirect count.
   * @private
   */
  redirects: number;

  /**
   * @param url
   * @param options
   */
  constructor(url: URL | string, options?: RequestData);

  /**
   * The method type this request is executing.
   */
  get methodType(): Method;

  /**
   * Set the request method.
   * @param method The method type.
   */
  method(method: Method): this;

  /**
   * Set the body of this request.
   * @param value The body value.
   */
  body(value: unknown): this;

  /**
   * Sets the timeout.
   * @param ms The timeout.
   */
  timeout(ms: number): this;

  /**
   * Sets the abort signal for this request.
   * @param signal
   */
  signal(signal: AbortController): this;

  /**
   * Set the request query.
   * @param obj The query object.
   */
  query(obj: NodeJS.Dict<string | string[]> | URLSearchParams): this;

  /**
   * Set an individual query parameter.
   * @param key The query parameter.
   * @param value The value.
   */
  query(key: string, value: string | string[]): this;

  /**
   * Set the request agent.
   * @param agent The agent.
   */
  agent(agent: http.Agent | https.Agent): this;

  /**
   * Set headers for this request.
   * @param headers The headers to set.
   */
  set(headers: NodeJS.Dict<string>): this;

  /**
   * Set an individual header for this request.
   * @param header The header to set.
   * @param value The value.
   */
  set(header: string, value: string): this;

  /**
   * Toggles the ability to follow redirects, or you can limit them.
   * @param count The total number of redirects allowed.
   */
  follow(count?: number): this;

  /**
   * Toggles compression.
   */
  compress(): this;

  /**
   * Executes this request.
   */
  exec(): Promise<Response<T>>;
  
  /**
   * Executes the request.
   * @param onExecuted
   * @param onError
   */
  then(onExecuted?: (value: Response<T>) => void, onError?: (error: unknown) => void): Promise<void>;

  /**
   * Handles an error.
   * @param errorHandler
   */
  catch(errorHandler: (error: unknown) => void): Promise<void>;
}

/**
 * Makes a new request.
 * @param url The url to make the request to.
 * @param options The request options.
 */
export function make<T = unknown>(url: string | URL, options?: RequestData): Request<T>;

export interface RequestData {
  /**
   * The headers to use.
   */
  headers?: NodeJS.Dict<string>;

  /**
   * The request method.
   */
  method?: Method;

  /**
   * The request query.
   */
  query?: NodeJS.Dict<string | string[]> | URLSearchParams;

  /**
   * The request body.
   */
  body?: unknown;

  /**
   * The request timeout.
   */
  timeout?: number;

  /**
   * Toggles the ability to follow redirects, or you can limit them.
   */
  follow?: boolean | number;

  /**
   * Whether or not to compress the data.
   */
  compressData?: boolean;

  /**
   * The http(s) agent.
   */
  agent?: http.Agent | https.Agent;

  /**
   * The abort controller.
   */
  signal?: AbortController;
}

export class Response<T> {
  /**
   * The message.
   */
  readonly message: http.IncomingMessage;

  /**
   * The request.
   */
  readonly request: Request;

  /**
   * @param request
   * @param message
   */
  constructor(request: Request, message: http.IncomingMessage);

  /**
   * The headers of this response.
   */
  get headers(): http.IncomingHttpHeaders;

  /**
   * The status code of this response.
   */
  get statusCode(): number;

  /**
   * The status of this response.
   */
  get status(): string;

  /**
   * Parses the content as json.
   */
  get json(): T | null;

  /**
   * Gets the buffer response.
   */
  get buffer(): Buffer;

  /**
   * Get the blob representation of the response.
   */
  get blob(): Blob;

  /**
   * Gets the response as text.
   * @param encoding The encoding.
   */
  text(encoding?: BufferEncoding): string;
}

export const RIKUESUTO_METHODS: Method[];

export const RIKUESUTO_USER_AGENT: string;

export class Rikuesuto extends EventEmitter {
  /**
   * The default request data.
   */
  defaults: RequestData;

  /**
   * The user agent for all requests.
   */
  userAgent: string;

  /**
   * The base url for all requests.
   */
  baseUrl?: URL;

  /**
   * The total number of requests since this instance of instantiated .
   */
  requests: number;

  /**
   * @param options
   */
  constructor(options?: RikuesutoOptions);

  /**
   * Make a request to something.
   * @param url The URL.
   * @param options The options.
   */
  make<T>(url: string | URL, options?: RequestData): Request<T>;

    /**
   * Creates a new post request.
   * @param path The url path.
   * @param options The request options
   */
  post<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;
  
  /**
   * Creates a new get request.
   * @param path The url path.
   * @param options The request options
   */
  get<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new delete request.
   * @param path The url path.
   * @param options The request options
   */
  delete<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new patch request.
   * @param path The url path.
   * @param options The request options
   */
  patch<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new put request.
   * @param path The url path.
   * @param options The request options
   */
  put<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new options request.
   * @param path The url path.
   * @param options The request options
   */
  options<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new connect request.
   * @param path The url path.
   * @param options The request options
   */
  connect<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;

  /**
   * Creates a new trace request.
   * @param path The url path.
   * @param options The request options
   */
  trace<T = unknown>(path: string, options?: RequestData): Promise<Response<T>>;
}

export type Method =
  | "post"
  | "get"
  | "delete"
  | "patch"
  | "put"
  | "options"
  | "connect"
  | "trace";

export interface RikuesutoOptions {
  userAgent?: string;
  defaults?: RequestData;
  baseUrl?: string;
}
