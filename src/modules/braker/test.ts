import { CircuitBreaker } from './CircuitBraker'
import logger from '../../helpers/logger'
import axios from 'axios'
import { delay } from '../../helpers/datetime'

const circuitBreaker = new CircuitBreaker<boolean>(failureFunction, {
  timeout: 2000,
  fallback: (err) => {
    logger.error(`Error ocurred: ${err}`)
  },
  onSuccess: (response) => {
    logger.info(`Petición exitosa: ${response}`)
  },
})

async function failureFunction() {
  await delay(1000)
  const response = await axios.get('http://localhost:3000')
  return true
}

circuitBreaker.exec()
