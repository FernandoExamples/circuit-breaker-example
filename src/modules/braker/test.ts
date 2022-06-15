import { CircuitBreaker } from './CircuitBraker'
import logger from '../../helpers/logger'
import axios from 'axios'

const circuitBreaker = new CircuitBreaker(failureFunction, {
  fallback: (err) => {
    logger.error(`Error ocurred: ${err}`)
  },
  onSuccess: () => {
    logger.info('Petición exitosa')
  },
})

async function failureFunction() {
  const response = await axios.get('http://localhost:3000')
}

circuitBreaker.exec()
