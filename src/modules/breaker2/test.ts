import { delay } from '../../helpers/datetime'
import axios from 'axios'
import { RetryCircuitBraker } from './RetryCircuitBreaker'
import logger from '../../helpers/logger'

const servers = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']

async function asyncFunctionThatCouldFail(url: string) {
  logger.debug(`Haciendo petición a ${url}`)
  await delay(2000)
  const response = await axios.get(url)
  return response.data
}

for (let i = 0; i < 3; i++) {
  const retryCircuit = new RetryCircuitBraker(asyncFunctionThatCouldFail, {
    timeout: 6000,
    errorThresholdPercentage: 50,
    resetTimeout: 8000,
    maxRetries: 3,
    maxTimeWait: 10000,
    name: `${i}`,
  })

  retryCircuit
    .tryAction(servers[i])
    .then((a) => console.log(`La respesta: ${a}`))
    .catch((e) => logger.error(e.message))
}
