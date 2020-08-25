import { URL } from "url";

export class HttpError extends Error {
  /**
   * The status code.
   */
  public readonly statusCode: number

  /**
   * The URL, if any.
   */
  public readonly url?: URL;

  /**
   * @param code
   * @param message
   * @param url
   */
  public constructor(code: number, message: string, url?: string) {
    super(message);

    this.statusCode = code;
    this.name = `HTTPError[${code}]`;
    if (url) this.url = new URL(url);
  }
}