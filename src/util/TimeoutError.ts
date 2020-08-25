import { URL } from "url";

export class TimeoutError extends Error {
  /**
   * The URL
   */
  public readonly url: URL

  /**
   * @param url
   */
  public constructor(url: string) {
    super(`Request to ${url} has timed out.`);

    this.url = new URL(url);
  }
}