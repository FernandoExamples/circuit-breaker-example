import CircuitBreaker from 'opossum'
import { delay } from '../../helpers/datetime'
import logger from '../../helpers/logger'

interface Options extends CircuitBreaker.Options {
  maxRetries: number
}

export class RetryCircuitBraker<TI extends unknown[] = unknown[], TR = unknown> {
  private circuitBreaker: CircuitBreaker<TI, TR>
  private options: Options

  private retryCount = 0
  private delayMillis = 500

  constructor(action: (...args: TI) => Promise<TR>, options: Options) {
    this.circuitBreaker = new CircuitBreaker(action, options)
    this.options = options

    this.circuitBreaker.on('open', () => logger.info('Breaker is Open'))
    this.circuitBreaker.on('halfOpen', () => {
      logger.info('Breaker is Half Open')
      this.delayMillis = 500
    })
    this.circuitBreaker.on('close', () => {
      this.delayMillis = 500
      this.retryCount = 0
    })
  }

  public async tryAction(...args: TI): Promise<TR> {
    if (this.retryCount > this.options.maxRetries) {
      throw new Error('Max retries has reached')
    }

    try {
      const response = await this.circuitBreaker.fire(...args)
      return response
    } catch (error: any) {
      logger.warn(`Retrying Action due to ${error.message}...`)
      logger.debug(`Waiting ${this.delayMillis} millis`)

      await delay(this.delayMillis)

      if (!this.circuitBreaker.opened) this.retryCount += 1

      this.delayMillis *= 2
      return await this.tryAction(...args)
    }
  }
}
