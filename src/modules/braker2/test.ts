import { delay } from '../../helpers/datetime'
import axios from 'axios'
import CircuitBreaker from 'opossum'
import { RetryCircuitBraker } from './RetryCircuitBraker'

async function asyncFunctionThatCouldFail() {
  await delay(2000)
  const response = await axios.get('http://localhost:3000')
  return true
}

// const breaker = new CircuitBreaker(asyncFunctionThatCouldFail, {
//   timeout: 3000,
//   errorThresholdPercentage: 50,
//   resetTimeout: 4000,
// })

// breaker
//   .fire(2)
//   .then((response) => {
//     console.log(`Petición exitosa: ${response}`)
//   })
//   .catch((err) => console.log('Fallo aqui:', err.message))

const retryCircuit = new RetryCircuitBraker(asyncFunctionThatCouldFail, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 4000,
  waitTime: 1000,
  onSuccess: () => {
    console.log('Exito')
  },
})
retryCircuit.tryAction(5000)
