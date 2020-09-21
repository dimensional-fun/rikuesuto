import * as http from "http";
import * as https from "https";
import * as zlib from "zlib";
import { URL, URLSearchParams } from "url";
import { Blob, defaultRequestOptions, fromRawHeaders, Headers, HeadersInit, HttpError, TimeoutError } from "./util";
import { Response } from "./Response";
import { Method, RIKUESUTO_USER_AGENT } from "./Client";

const isObject = (data: unknown): data is object => typeof data === 'object';

let FormData: typeof import("form-data") | undefined;
try {
  FormData = require("form-data");
} catch (e) {
}

export class Request<T = unknown> {
  /**
   * The URL to request.
   */
  public url: URL;

  /**
   * The redirect count.
   * @private
   */
  public redirects: number;

  /**
   * Data to use... wip
   */
  private _method: Method;

  /**
   * The data to send.
   * @private
   */
  private _body: unknown;

  /**
   * The abort controller signal.
   * @private
   */
  private _signal?: AbortSignal;

  /**
   * The headers for this request.
   * @private
   */
  private readonly _headers: Headers;

  /**
   * The options provided to this request.
   * @private
   */
  private readonly _options: RequestData;

  /**
   * @param url
   * @param options
   */
  public constructor(url: URL | string, options: RequestData = {}) {
    options = Object.assign(defaultRequestOptions, options);

    this.url = new URL(url.toString());
    this.redirects = 0;

    this._method = options.method! ?? "get";
    this._body = options.body;
    this._options = options;
    this._headers = new Headers(options.headers ?? {})
    this._signal = options.signal;

    if (options.query) {
      for (const [ k, v ] of Object.entries(options.query)) {
        this.url.searchParams.append(k, v);
      }
    }
  }

  /**
   * The method type this request is executing.
   */
  public get methodType(): Method {
    return this._method;
  }

  /**
   * Set the request method.
   * @param method The method type.
   */
  public method(method: Method): this {
    this._method = method;
    return this;
  }

  /**
   * Set the body of this request.
   * @param value The body value.
   */
  public body(value: unknown): this {
    this._body = value;
    return this;
  }

  /**
   * Sets the timeout.
   * @param ms The timeout.
   */
  public timeout(ms: number): this {
    this._options.timeout = ms;
    return this;
  }

  /**
   * Sets the abort signal for this request.
   * @param signal
   */
  public signal(signal: AbortSignal): this {
    this._signal = signal;
    return this;
  }

  /**
   * Set the request query.
   * @param obj The query object.
   */
  public query(obj: NodeJS.Dict<string | string[]> | URLSearchParams): this;
  /**
   * Set an individual query parameter.
   * @param key The query parameter.
   * @param value The value.
   */
  public query(key: string, value: string | string[]): this
  public query(a: NodeJS.Dict<string | string[]> | URLSearchParams | string, b?: string | string[]): this {
    if (typeof a === "string") {
      if (!b) throw new Error(`Must provide a value for query parameter: ${a}`);

      b = Array.isArray(b) ? b : [ b ];
      for (const v of b) this.url.searchParams.append(a, v);

      return this;
    }

    for (const [ k, v ] of Object.entries(a)) {
      this.url.searchParams.append(k, v);
    }

    return this;
  }

  /**
   * Set the request agent.
   * @param agent The agent.
   */
  public agent(agent: http.Agent | https.Agent) {
    this._options.agent = agent;
    return this;
  }

  /**
   * Set headers for this request.
   * @param headers The headers to set.
   */
  public set(headers: NodeJS.Dict<string>): this;
  /**
   * Set an individual header for this request.
   * @param header The header to set.
   * @param value The value.
   */
  public set(header: string, value: string): this
  public set(a: NodeJS.Dict<string> | string, b?: string): this {
    if (typeof a === "string") {
      if (!b) throw new Error(`You must provide a value for header "${a}"`);
      this._headers.append(a, b);
      return this;
    }

    for (const [ k, v ] of Object.entries(a)) {
      this._headers.append(k, v as string);
    }

    return this;
  }

  /**
   * Toggles the ability to follow redirects, or you can limit them.
   * @param count The total number of redirects allowed.
   */
  public follow(count?: number): this {
    if (count) {
      this._options.follow = count;
      return this;
    }

    this._options.follow = !this._options.follow;
    return this;
  }

  /**
   * Toggles compression.
   */
  public compress(): this {
    this._options.compressData = !this._options.compressData;
    return this;
  }

  /**
   * Executes this request.
   */
  public exec(): Promise<Response<T>> {
    if (!this._headers.get("user-agent")) {
      this._headers.set("user-agent", RIKUESUTO_USER_AGENT);
    }

    if (!this._headers.get("content-type") && this._body) {
      let contentType

      if (FormData && this._body instanceof FormData) contentType = this._body.getHeaders()["content-type"];
      else if (isObject(this._body)) contentType = "application/json";

      if (contentType) this.set("content-type", contentType);
    }

    return new Promise(async (resolve, reject) => {
      const request = (this.url.protocol === "https:" ? https : http).request;
      const req = request({
        hostname: this.url.hostname,
        port: this.url.port,
        method: this._method.toUpperCase(),
        path: `${this.url.pathname}${this.url.search}`,
        username: this.url.username,
        password: this.url.password,
        pathname: this.url.pathname,
        href: this.url.href,
        searchParams: this.url.searchParams,
        search: this.url.search,
        headers: this._headers.raw(),
        protocol: this.url.protocol,
        agent: this._options.agent
      });

      const finalize = () => {
        void req.abort();
        void this._signal?.removeEventListener("abort", aborted);
      }

      const aborted = (): void => {
        finalize()

        const error = new Error("Signal was aborted.")
        error.name = "AbortError";
        return reject(error);
      }

      if (this._signal) {
        if (this._signal && this._signal.aborted) return aborted();
        this._signal.addEventListener("abort", aborted)
      }

      req.on("response", async (resp: http.IncomingMessage) => {
        if (this._options.compressData) {
          const encoding = resp.headers["content-encoding"];
          if (encoding === "gzip") resp.pipe(zlib.createGunzip());
          if (encoding === "deflate") resp.pipe(zlib.createDeflate());
        }

        const headers = fromRawHeaders(resp.rawHeaders)
        if (headers.get("Location") && this._options.follow) {
          if (this.redirects !== this._options.follow) {
            const req = new Request<T>(new URL(headers.get("Location") as string, this.url), {
              ...this._options,
              headers: this._headers,
              body: this._body
            });

            req.redirects = this.redirects;
            resp.resume();
            return resolve(await req.exec());
          }
        }

        const res = new Response<T>(this, resp);

        resp.on("data", (c) => res._chunk(c));

        resp.on("end", () => {
          void this._signal?.removeEventListener("abort", aborted);
          return resolve(res);
        });

        resp.on("error", (e) => {
          void finalize();
          return reject(new HttpError(res.statusCode, e.message, this.url.toString()));
        });
      })


      req.on("error", (e) => {
        void finalize();
        return reject(e);
      });

      if (this._options.timeout) {
        setTimeout(() => {
          void finalize()
          return reject(new TimeoutError(this.url.toString()));
        }, this._options.timeout!);
      }

      if (this._body) {
        let _body = this._body;

        if (this._body instanceof Object) _body = JSON.stringify(this._body);
        if (this._body instanceof Blob) _body = this._body.data()
        if (_body instanceof Promise) _body = await _body;

        req.write(_body);
      }

      req.end();
    });
  }

  /**
   * Executes the request.
   * @param onExecuted
   * @param onError
   */
  public then(onExecuted?: (value: Response<T>) => void, onError?: (error: unknown) => void): Promise<void> {
    return this.exec()
      .then(onExecuted)
      .catch(onError);
  }

  /**
   * Handles an error.
   * @param errorHandler
   */
  public catch(errorHandler: (error: unknown) => void): Promise<void> {
    return this.then(undefined, errorHandler);
  }
}

/**
 * Makes a new request.
 * @param url The url to make the request to.
 * @param options The request options.
 */
export function make<T = unknown>(url: string | URL, options: RequestData = {}): Request<T> {
  return new Request<T>(url, options);
}

export interface RequestData {
  /**
   * The headers to use.
   */
  headers?: HeadersInit;

  /**
   * The request method.
   */
  method?: Method;

  /**
   * The request query.
   */
  query?: NodeJS.Dict<unknown | unknown[]> | URLSearchParams;

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
  signal?: AbortSignal;
}

export type AbortSignal = {
  readonly aborted: boolean;
  addEventListener(type: "abort", listener: (this: AbortSignal) => void): void;
  removeEventListener(type: "abort", listener: (this: AbortSignal) => void): void;
}
