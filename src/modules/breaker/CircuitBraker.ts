import EventEmitter from 'events'

export enum BreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class BreakerOptions {
  constructor(
    public failureThreshold?: number,
    public successThreshold?: number,
    public resetTimeout?: number,
    public timeout?: number
  ) {}
}

export class CircuitBreaker<AR extends unknown[], R> extends EventEmitter {
  private state: BreakerState

  private failureCount: number
  private successCount: number

  private nextAttempt: number

  // Options
  private failureThreshold: number
  private successThreshold: number
  private resetTimeout: number
  private timeout: number

  //callbacks
  private failerFunction: (...args: AR) => Promise<R>

  constructor(failerFunction: (...args: AR) => Promise<R>, options?: BreakerOptions) {
    super()
    this.failerFunction = failerFunction
    this.state = BreakerState.CLOSED

    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt = Date.now()

    this.failureThreshold = options?.failureThreshold || 3
    this.successThreshold = options?.successThreshold || 2
    this.resetTimeout = options?.resetTimeout || 5000
    this.timeout = options?.timeout || 3000
  }

  private log(result: string): void {
    console.table({
      Result: result,
      Successes: this.successCount,
      Failures: this.failureCount,
      State: this.state,
    })
  }

  private success() {
    this.failureCount = 0

    if (this.state == BreakerState.HALF_OPEN) {
      this.successCount++

      if (this.successCount > this.successThreshold) {
        this.successCount = 0
        this.state = BreakerState.CLOSED
        this.emit('close')
      }
    }

    this.log('Success')
  }

  private failure() {
    this.failureCount++

    if (this.failureCount >= this.failureThreshold || this.state == BreakerState.HALF_OPEN) {
      this.state = BreakerState.OPEN
      this.nextAttempt = Date.now() + this.resetTimeout

      this.emit('open')
    }

    this.log('Failure')
  }

  async wrapperTimeout(...args: AR) {
    return new Promise<R>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Process Timeout')), this.timeout)
      this.failerFunction(...args)
        .then((response) => resolve(response))
        .catch((e) => reject(e))
        .finally(() => clearTimeout(timeout))
    })
  }

  public async exec(...args: AR) {
    if (this.state === BreakerState.OPEN) {
      if (this.nextAttempt <= Date.now()) {
        this.state = BreakerState.HALF_OPEN
        this.emit('halfOpen')
      } else {
        throw new Error(`Circuit is suspended!`)
      }
    }

    try {
      const response = await this.wrapperTimeout(...args)
      this.success()
      return response
    } catch (err: any) {
      this.failure()
      throw err
    }
  }

  get opened() {
    return this.state === BreakerState.OPEN
  }
}
