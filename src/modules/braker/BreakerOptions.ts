export enum BreakerState {
  GREEN = 'GREEN',
  RED = 'RED',
  YELLOW = 'YELLOW',
}

export class BreakerOptions {
  constructor(public failureThreshold: number, public successThreshold: number, public timeout: number) {}
}
