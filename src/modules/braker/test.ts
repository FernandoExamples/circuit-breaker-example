import { CircuitBreaker } from './CircuitBraker'
import logger from '../../helpers/logger'
import axios from 'axios'

const circuitBreaker = new CircuitBreaker<boolean>(failureFunction, {
  fallback: (err) => {
    logger.error(`Error ocurred: ${err}`)
  },
  onSuccess: (response) => {
    logger.info(`Petición exitosa: ${response}`)
  },
})

async function failureFunction() {
  const response = await axios.get('http://localhost:3000')
  return true
}

circuitBreaker.exec()
