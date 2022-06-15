import { CircuitBreaker } from './CircuitBraker'

const circuitBreaker = new CircuitBreaker({
  method: 'get',
  url: 'http://localhost:3000',
})

setInterval(() => {
  circuitBreaker.exec()
}, 1000)
