import { CircuitBreaker } from './CircuitBraker'
import logger from '../../helpers/logger'
import axios from 'axios'
import { delay } from '../../helpers/datetime'

async function failureFunction() {
  await delay(1000)
  const response = await axios.get('http://localhost:3000')
  return true
}

const circuitBreaker = new CircuitBreaker(failureFunction, {
  timeout: 2000,
})

circuitBreaker
  .exec()
  .then((resp) => console.log(`Respuesta: ${resp}`))
  .catch((err) => console.error(err.message))
