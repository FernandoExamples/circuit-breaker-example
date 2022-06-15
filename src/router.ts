import { Router } from 'express'
const router = Router()

//importing all routes here
router.get('/', (req, res) => {
  if (Math.random() > 0.5) {
    res.status(200).send('Success!')
  } else {
    res.status(400).send('Failed!')
  }
})

export default router
