import CircuitBreaker from 'opossum'
import { delay } from '../../helpers/datetime'
import logger from '../../helpers/logger'

interface Options extends CircuitBreaker.Options {
  waitTime: number
  onSuccess?: () => void
}

export class RetryCircuitBraker {
  private circuitBreaker: CircuitBreaker
  private options: Options

  constructor(action: () => Promise<any>, options: Options) {
    this.circuitBreaker = new CircuitBreaker(action, options)
    this.options = options

    this.circuitBreaker.on('open', () => logger.info('Breaker is Open'))
    this.circuitBreaker.on('halfOpen', () => logger.info('Breaker is Half Open'))
    this.circuitBreaker.on('close', () => logger.info('Breaker is Close'))
  }

  public async tryAction(timeLimit: number) {
    try {
      await this.circuitBreaker.fire()
      if (this.options.onSuccess) this.options.onSuccess()
    } catch (error: any) {
      logger.warn(`Retrying Action due to ${error.message}...`)
      await delay(this.options.waitTime)
      await this.tryAction(timeLimit)
    }
  }
}
