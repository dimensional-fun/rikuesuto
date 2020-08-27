import { EventEmitter } from "events";
import { Request, RequestData } from "./Request";
import { URL } from "url";

import type { Response } from "./Response";

export const RIKUESUTO_METHODS: Method[] = [ "post", "get", "delete", "patch", "put", "options", "connect", "trace" ]
export const RIKUESUTO_USER_AGENT = `Rikuesuto (${require("../package.json").version}, https://github.com/melike2d/rikuesuto)`;

export class Rikuesuto extends EventEmitter {
  /**
   * The default request data.
   */
  public defaults: RequestData;

  /**
   * The user agent for all requests.
   */
  public userAgent: string;

  /**
   * The base url for all requests.
   */
  public baseUrl?: URL;

  /**
   * The total number of requests since this instance of instantiated .
   */
  public requests: number;

  /**
   * @param options
   */
  public constructor(options: RikuesutoOptions = {}) {
    super();

    this.defaults = options.defaults ?? {};
    this.userAgent = options.userAgent ?? RIKUESUTO_USER_AGENT;
    this.baseUrl = options.baseUrl ? new URL(options.baseUrl.toString()) : undefined;
    this.requests = 0;

    for (const method of RIKUESUTO_METHODS) {
      this[method] = <T>(path: string, options?: RequestData): Promise<Response<T>> => {
        return this.make<T>(path, options)
          .method(method)
          .exec();
      }
    }
  }

  /**
   * Make a request to something.
   * @param url The URL.
   * @param options The options.
   */
  public make<T>(url: string | URL, options: RequestData = {}): Request<T> {
    this.requests++;
    options = Object.assign(options, this.defaults);
    if (this.baseUrl) {
      if (url instanceof URL) url = new URL(url.pathname, this.baseUrl);
      if (typeof url === "string") {
        let _url = /^\//.test(url) ? url : `/${url}`;
        url = new URL(`${this.baseUrl}${_url}`);
      }
    }

    const req = new Request<T>(url, options);
    this._debug(`#${this.requests} request: ${req.methodType.toUpperCase()} to ${url}.`);

    return this.userAgent ? req.set("user-agent", this.userAgent) : req;
  }

  /**
   * @private
   */
  private _debug(message: string): void {
    this.emit("debug", message);
  }
}

export type Method = "post" | "get" | "delete" | "patch" | "put" | "options" | "connect" | "trace";

export interface Rikuesuto {
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

export interface RikuesutoOptions {
  userAgent?: string;
  defaults?: RequestData;
  baseUrl?: string;
}
