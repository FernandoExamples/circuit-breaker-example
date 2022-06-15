import { BreakerOptions } from './BreakerOptions'
import { BreakerState } from './BreakerOptions'

export class CircuitBreaker<T> {
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
  private failerFunction: () => Promise<T>
  private fallback?: (err: any) => void
  private onSuccess?: (response: T) => void

  constructor(failerFunction: () => Promise<T>, options?: BreakerOptions<T>) {
    this.failerFunction = failerFunction
    this.state = BreakerState.GREEN

    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt = Date.now()

    this.failureThreshold = options?.failureThreshold || 3
    this.successThreshold = options?.successThreshold || 2
    this.resetTimeout = options?.resetTimeout || 5000
    this.timeout = options?.timeout || 3000

    this.fallback = options?.fallback
    this.onSuccess = options?.onSuccess
  }

  private log(result: string): void {
    console.table({
      Result: result,
      Timestamp: Date.now(),
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
      }
    }

    this.log('Success')
  }

  private failure() {
    this.failureCount++

    if (this.failureCount >= this.failureThreshold) {
      this.state = BreakerState.RED

      this.nextAttempt = Date.now() + this.resetTimeout
    }

    this.log('Failure')
  }

  async wrapperTimeout() {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => reject(new Error('Process Timeout')), this.timeout)
      this.failerFunction()
        .then((response) => resolve(response))
        .catch((e) => reject(e))
    })
  }

  public async exec() {
    if (this.state === BreakerState.RED) {
      if (this.nextAttempt <= Date.now()) {
        this.state = BreakerState.YELLOW
      } else {
        if (this.fallback) this.fallback(new Error(`Circuit is suspended: ${this.state}`))
      }
    }

    try {
      const response = await this.wrapperTimeout()
      this.success()
      if (this.onSuccess) this.onSuccess(response)
    } catch (err: any) {
      this.failure()
      if (this.fallback) this.fallback(err)
    }
  }
}
