import CircuitBreaker from 'opossum'
import { delay } from '../../helpers/datetime'
import logger from '../../helpers/logger'

interface Options extends CircuitBreaker.Options {
  waitTime: number
}

export class RetryCircuitBraker<TI extends unknown[] = unknown[], TR = unknown> {
  private circuitBreaker: CircuitBreaker<TI, TR>
  private options: Options

  constructor(action: (...args: TI) => Promise<TR>, options: Options) {
    this.circuitBreaker = new CircuitBreaker(action, options)
    this.options = options

    this.circuitBreaker.on('open', () => logger.info('Breaker is Open'))
    this.circuitBreaker.on('halfOpen', () => logger.info('Breaker is Half Open'))
    this.circuitBreaker.on('close', () => logger.info('Breaker is Close'))
  }

  public async tryAction(timeLimit: number, ...args: TI): Promise<TR> {
    try {
      const response = await this.circuitBreaker.fire(...args)
      return response
    } catch (error: any) {
      logger.warn(`Retrying Action due to ${error.message}...`)
      await delay(this.options.waitTime)
      return await this.tryAction(timeLimit, ...args)
    }
  }
}
