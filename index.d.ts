import type { URL, URLSearchParams } from "url";
import type { Agent as HTTPAgent, IncomingHttpHeaders, IncomingMessage } from "http";
import type { Agent as HTTPSAgent } from "https";
import type { AbortController } from "abort-controller";

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
   * Merges the current query config idfk.
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
  agent(agent: HTTPAgent | HTTPSAgent): this;

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

export class Response<T> {
  /**
   * The message.
   */
  readonly message: IncomingMessage;
  /**
   * The request.
   */
  readonly request: Request;

  /**
   * @param request
   * @param message
   */
  constructor(request: Request, message: IncomingMessage);

  /**
   * The headers of this response.
   */
  get headers(): IncomingHttpHeaders;

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
   * Gets the response as text.
   * @param encoding The encoding.
   */
  text(encoding?: BufferEncoding): string;
}

/**
 * Makes a new request.
 * @param url The url to make the request to.
 * @param options The request options.
 */
export function make<T = unknown>(url: string | URL, options?: RequestData): Request<T>;

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
  agent?: HTTPAgent | HTTPSAgent;

  /**
   * The abort controller.
   */
  signal?: AbortController;
}
