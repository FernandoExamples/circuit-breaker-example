export enum BreakerState {
  GREEN = 'GREEN',
  RED = 'RED',
  YELLOW = 'YELLOW',
}

export class BreakerOptions<T> {
  constructor(
    public failureThreshold?: number,
    public successThreshold?: number,
    public resetTimeout?: number,
    public timeout?: number
  ) {}
}
