import { delay } from '../../helpers/datetime'
import axios from 'axios'
import { RetryCircuitBraker } from './RetryCircuitBreaker'
import logger from '../../helpers/logger'

async function asyncFunctionThatCouldFail() {
  logger.debug('Haciendo peticion')
  await delay(2000)
  const response = await axios.get('http://localhost:3000')
  return true
}

const retryCircuit = new RetryCircuitBraker(asyncFunctionThatCouldFail, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 5000,
  maxRetries: 3,
})

retryCircuit
  .tryAction()
  .then((a) => console.log(`La respesta: ${a}`))
  .catch((e) => logger.error(e.message))
