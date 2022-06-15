export enum BreakerState {
  GREEN = 'GREEN',
  RED = 'RED',
  YELLOW = 'YELLOW',
}

export class BreakerOptions<T> {
  constructor(
    public failureThreshold?: number,
    public successThreshold?: number,
    public timeout?: number,
    public fallback?: (err: any) => void,
    public onSuccess?: (response: T) => void
  ) {}
}
