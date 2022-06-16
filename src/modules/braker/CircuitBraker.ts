import EventEmitter from 'events'

export enum BreakerState {
  GREEN = 'GREEN',
  RED = 'RED',
  YELLOW = 'YELLOW',
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
    this.state = BreakerState.GREEN

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

    if (this.state == BreakerState.YELLOW) {
      this.successCount++

      if (this.successCount > this.successThreshold) {
        this.successCount = 0
        this.state = BreakerState.GREEN
        this.emit('close')
      }
    }

    this.log('Success')
  }

  private failure() {
    this.failureCount++

    if (this.failureCount >= this.failureThreshold) {
      this.state = BreakerState.RED
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
    if (this.state === BreakerState.RED) {
      if (this.nextAttempt <= Date.now()) {
        this.state = BreakerState.YELLOW
        this.emit('halfOpen')
      } else {
        throw new Error(`Circuit is suspended: ${this.state}`)
      }
    }

    try {
      const response = await this.wrapperTimeout(...args)
      return response
    } catch (err: any) {
      this.failure()
      throw err
    }
  }

  get opened() {
    return this.state === BreakerState.RED
  }
}
