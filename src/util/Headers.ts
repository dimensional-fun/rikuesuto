/**
 * @file https://github.com/node-fetch/node-fetch/blob/master/src/headers.js
 */

import { URLSearchParams } from "url";
import { types } from "util";

/**
 * @param name
 */
const validateHeaderName = (name: string) => {
  if (!/^[\^`\-\w!#$%&"*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
    throw err;
  }
};

/**
 * @param name
 * @param value
 */
const validateHeaderValue = (name: string, value: string) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
    throw err;
  }
};

export class Headers extends URLSearchParams {
  /**
   * Creates a new instance of Headers.
   * @param init The headers data.
   */
  public constructor(init: HeadersInit) {
    let result: any = [];
    if (init instanceof Headers) {
      const raw = init.raw();
      for (const [ name, values ] of Object.entries(raw)) {
        result.push(...values.map(value => [ name, value ]));
      }
    } else if (init == null) {
      // noop
    } else if (typeof init === "object" && !types.isBoxedPrimitive(init)) {
      // @ts-expect-error
      const method = init[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init));
      } else {
        if (typeof method !== "function") throw new TypeError("Header pairs must be iterable");

        // @ts-expect-error
        result = [ ...init ]
          .map(pair => {
            if (
              typeof pair !== "object" || types.isBoxedPrimitive(pair)
            ) {
              throw new TypeError("Each header pair must be an iterable object");
            }

            return [ ...pair ];
          }).map(pair => {
            if (pair.length !== 2) {
              throw new TypeError("Each header pair must be a name/value tuple");
            }

            return [ ...pair ];
          });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)'");
    }

    // Validate and lowercase
    result =
      result.length > 0 ?
        result.map(([ name, value ]: [ string, string ]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [ String(name).toLowerCase(), String(value) ];
        }) :
        undefined;

    super(result);

    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case 'append':
          case 'set':
            return (name: string, value: unknown) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };

          case 'delete':
          case 'has':
          case 'getAll':
            return (name: string) => {
              validateHeaderName(name);
              // @ts-expect-error
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };

          case 'keys':
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };

          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

  /**
   * The string representation of this instance.
   */
  public toString(): string {
    return Object.prototype.toString.call(this);
  }

  /**
   * Get a header.
   * @param name The header name.
   */
  public get(name: string): string | null {
    const values = this.getAll(name);
    if (values.length === 0) return null;

    let value = values.join(', ');
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }

    return value;
  }

  /**
   * Runs a function on every entry.
   * @param callback
   */
  public forEach(callback: (value: string, key: string, headers: this) => void): void {
    for (const name of this.keys())
      callback(this.get(name) as string, name, this);

    return;
  }

  /**
   * All of the values.
   */
  public * values(): IterableIterator<string> {
    for (const name of this.keys()) {
      yield this.get(name) as string;
    }
  }

  /**
   * All of the entries.
   */
  public * entries(): IterableIterator<[ string, string ]> {
    for (const name of this.keys()) {
      yield [ name, this.get(name) as string ];
    }
  }

  /**
   * Node-fetch non-spec method
   * returning all headers and their values as array
   * @returns {Record<string, string[]>}
   */
  public raw() {
    return [ ...this.keys() ].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {} as Record<string, string[]>);
  }

  /**
   * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
   */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return [ ...this.keys() ].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === 'host') result[key] = values[0];
      else result[key] = values.length > 1 ? values : values[0];
      return result;
    }, {} as NodeJS.Dict<any>);
  }
}

/**
 * Create a Headers object from an http.IncomingMessage.rawHeaders, ignoring those that do
 * not conform to HTTP grammar productions.
 * @param headers
 */
export function fromRawHeaders(headers: string[] = []): Headers {
  return new Headers(
    headers
      .reduce((result, _v, index, array) => {
        if (index % 2 === 0) result.push(array.slice(index, index + 2));
        return result;
      }, [] as (string[])[])
      .filter(([ name, value ]) => {
        try {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return true;
        } catch {
          return false;
        }
      })
  );
}

export type HeadersInit =
  Headers
  | Record<string, string>
  | Iterable<readonly [ string, string ]>
  | Iterable<Iterable<string>>;
