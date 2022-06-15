import { CircuitBreaker } from './CircuitBraker'
import logger from '../../helpers/logger'
import axios from 'axios'

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
  await wait(1000)
  const response = await axios.get('http://localhost:3000')
  return true
}

export async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

circuitBreaker.exec()
