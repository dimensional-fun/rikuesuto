import { IncomingHttpHeaders, IncomingMessage, STATUS_CODES } from "http";

import type { Request } from "./Request";

export class Response<T> {
  /**
   * The message.
   */
  public readonly message: IncomingMessage;

  /**
   * The request.
   */
  public readonly request: Request;

  /**
   * @private
   */
  private _buf: Buffer;

  /**
   * @param request
   * @param message
   */
  public constructor(request: Request, message: IncomingMessage) {
    this.request = request;
    this.message = message;
    this._buf = Buffer.alloc(0);
  }

  /**
   * The headers of this response.
   */
  public get headers(): IncomingHttpHeaders {
    return this.message.headers;
  }

  /**
   * The status code of this response.
   */
  public get statusCode(): number {
    return this.message.statusCode ?? 200;
  }

  /**
   * The status of this response.
   */
  public get status(): string {
    return `${this.statusCode} ${STATUS_CODES[this.statusCode]}`
  }

  /**
   * Parses the content as json.
   */
  public get json(): T | null {
    return this.message.statusCode !== 204 && this.headers["content-type"] === "application/json"
      ? JSON.parse(this.text()!)
      : null;
  }

  /**
   * Gets the buffer response.
   */
  public get buffer(): Buffer {
    return this._buf;
  }

  /**
   * @private
   */
  _chunk(data: Uint8Array): Response<T> {
    this._buf = Buffer.concat([ this._buf, data ]);
    return this;
  }

  /**
   * Gets the response as text.
   * @param encoding The encoding.
   */
  public text(encoding?: BufferEncoding): string {
    return this._buf.toString(encoding);
  }
}