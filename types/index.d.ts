// TypeScript Version: 3.0

type CallbackFn<T = unknown> = (err: Error | null, res: T | null) => void;

export interface Prepr {
}

declare function prepr(accessToken: string, timeout?: number, userId?: string): Prepr;

export default prepr;
