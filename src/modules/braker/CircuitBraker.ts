import { BreakerOptions } from './BreakerOptions'
import { BreakerState } from './BreakerOptions'
import axios, { AxiosRequestConfig } from 'axios'
import logger from '../../helpers/logger'

export class CircuitBreaker {
  private request: AxiosRequestConfig
  private state: BreakerState

  private failureCount: number
  private successCount: number

  private nextAttempt: number

  // Options
  private failureThreshold: number
  private successThreshold: number
  private timeout: number

  constructor(request: AxiosRequestConfig, options?: BreakerOptions) {
    this.request = request
    this.state = BreakerState.GREEN

    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt = Date.now()

    this.failureThreshold = options?.failureThreshold || 3
    this.successThreshold = options?.successThreshold || 2
    this.timeout = options?.timeout || 3500
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

  private success(res: any) {
    this.failureCount = 0

    if (this.state == BreakerState.YELLOW) {
      this.successCount++

      if (this.successCount > this.successThreshold) {
        this.successCount = 0
        this.state = BreakerState.GREEN
      }
    }

    this.log('Success')

    return res
  }

  private failure(res: any) {
    this.failureCount++

    if (this.failureCount >= this.failureThreshold) {
      this.state = BreakerState.RED

      this.nextAttempt = Date.now() + this.timeout
    }

    this.log('Failure')

    return res
  }

  public async exec(): Promise<any> {
    if (this.state === BreakerState.RED) {
      if (this.nextAttempt <= Date.now()) {
        this.state = BreakerState.YELLOW
      } else {
        // throw new Error('Circuit suspended. You shall not pass.')
        logger.error('Circuit suspended. You shall not pass and doing something else.')
      }
    }

    try {
      const response = await axios(this.request)

      if (response.status === 200) {
        return this.success(response.data)
      } else {
        return this.failure(response.data)
      }
    } catch (err: any) {
      return this.failure(err.message)
    }
  }
}
