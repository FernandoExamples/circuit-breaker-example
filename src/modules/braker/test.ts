import logger from '../../helpers/logger'
import axios from 'axios'
import { delay } from '../../helpers/datetime'
import { RetryCircuitBraker } from './RetryCircuitBreaker'

async function failureFunction() {
  logger.debug('Haciendo petición')
  await delay(1000)
  const response = await axios.get('http://localhost:3000')
  return true
}

const retryCircuit = new RetryCircuitBraker(failureFunction, {
  timeout: 2000,
  maxRetries: 2,
  resetTimeout: 12000,
  successThreshold: 2,
  failureThreshold: 2,
})

retryCircuit
  .tryAction()
  .then((a) => console.log(`La respesta: ${a}`))
  .catch((e) => logger.error(e.message))
  .finally(() => {
    retryCircuit
      .tryAction()
      .then((a) => console.log(`La respesta: ${a}`))
      .catch((e) => logger.error(e.message))
      .finally(() => {
        retryCircuit
          .tryAction()
          .then((a) => console.log(`La respesta: ${a}`))
          .catch((e) => logger.error(e.message))
      })
  })
