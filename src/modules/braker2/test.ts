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
  timeout: 6000,
  errorThresholdPercentage: 50,
  resetTimeout: 8000,
  maxRetries: 3,
  maxTimeWait: 50000,
})

let time = 1000

for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    retryCircuit
      .tryAction()
      .then((a) => console.log(`La respesta: ${a}`))
      .catch((e) => logger.error(e.message))
  }, 1)
  time += 500
}
