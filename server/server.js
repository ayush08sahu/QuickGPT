import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './config/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'

const app = express()

await connectDB()

// stripe webhook
app.post('/api/stripe', express.raw({ type: 'application/json'}),stripeWebhooks)

// middlewares
app.use(cors())
app.use(express.json())

// routes
app.get('/', (req, res) => {
    res.send('Api Working!')
})
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

const PORT = process.env.PORT || 3000

// start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})