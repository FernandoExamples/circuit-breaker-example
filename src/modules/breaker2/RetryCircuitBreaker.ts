import CircuitBreaker from 'opossum'
import { delay } from '../../helpers/datetime'
import logger from '../../helpers/logger'
import clc from 'cli-color'

interface Options extends CircuitBreaker.Options {
  maxRetries: number
  maxTimeWait: number
  name?: string
}

export class RetryCircuitBraker<TI extends unknown[] = unknown[], TR = unknown> {
  private circuitBreaker: CircuitBreaker<TI, TR>
  private options: Options

  private retryCount = 0
  private delayMillis = 1000

  constructor(action: (...args: TI) => Promise<TR>, options: Options) {
    this.circuitBreaker = new CircuitBreaker(action, options)
    this.options = options
    this.options.name = this.options.name || ''

    this.circuitBreaker.on('open', () => logger.info(clc.red(`[${this.options.name}] Breaker is Open`)))
    this.circuitBreaker.on('halfOpen', () => logger.info(clc.yellow(`[${this.options.name}] Breaker is Half Open`)))
    this.circuitBreaker.on('close', () => {
      logger.info(clc.green(`[${this.options.name}] Breaker is Close`))
      this.resetDelayAndTryCount()
    })
  }

  public async tryAction(...args: TI): Promise<TR> {
    if (this.retryCount >= this.options.maxRetries) {
      this.retryCount = 0
      throw new Error(`Max retries has reached: ${this.options.maxRetries}`)
    }

    try {
      const response = await this.circuitBreaker.fire(...args)
      return response
    } catch (error: any) {
      logger.warn(`[${this.options.name}] Retrying Action due to ${error.message}. Waiting ${this.delayMillis} millis`)

      if (error.code != 'EOPENBREAKER') {
        this.incrementTryCount()
        this.duplicateDelay()
      }

      await delay(this.delayMillis)
      return await this.tryAction(...args)
    }
  }

  private incrementTryCount() {
    this.retryCount += 1
  }

  private duplicateDelay() {
    this.delayMillis =
      this.delayMillis * 2 < this.options.maxTimeWait ? (this.delayMillis *= 2) : this.options.maxTimeWait
  }

  private resetDelayAndTryCount() {
    this.retryCount = 0
    this.delayMillis = 1000
  }
}
