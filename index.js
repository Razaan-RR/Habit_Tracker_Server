const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const uri =
  'mongodb+srv://habits-db:hufJP8Hj40cZj0Ty@clusterpractice.wzcrq6x.mongodb.net/?appName=ClusterPractice'

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    await client.connect()

    const db = client.db('habits-db')
    const modelCollection = db.collection('habits')

    // get method
    //find - find multiple data
    //findOne - find one particular document
    app.get('/habits', async (req, res) => {
      const result = await modelCollection.find().toArray() //promise
      res.send(result)
    })

    app.get('/habits/:id', async (req, res) => {
      const { id } = req.params
      const habit = await modelCollection.findOne({ _id: new ObjectId(id) })
      if (!habit) {
        return res.status(404).json({ message: 'Habit not found' })
      }
      res.send(habit)
    })

    app.get('/categories', async (req, res) => {
      try {
        const categories = await modelCollection
          .aggregate([
            { $group: { _id: '$category' } },
            { $project: { _id: 0, category: '$_id' } },
          ])
          .toArray()

        const categoryList = ['All', ...categories.map((c) => c.category)]
        res.send(categoryList)
      } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ message: 'Server error' })
      }
    })

    app.get('/latest-habits', async(req, res)=>{
      const result = await modelCollection.find().sort({createdAt: 'desc'}).limit(6).toArray()
      console.log(result)
      res.send(result)
    })

    // post method
    // insertOne
    // insertMany
    app.post('/habits', async (req, res) => {
      const data = req.body
      // console.log(data)
      const result = await modelCollection.insertOne(data)
      res.send({
        success: true,
        result,
      })
    })

    app.post('/habits/complete', async (req, res) => {
      try {
        const { habit, userEmail, userName } = req.body
        if (!habit || !userEmail) {
          return res.status(400).json({ message: 'Missing habit or userEmail' })
        }

        const existing = await modelCollection.findOne({
          title: habit.title,
          ownerEmail: userEmail,
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (existing) {
          const alreadyCompleted = existing.completionHistory?.some((entry) => {
            const entryDate = new Date(entry.createdAt)
            entryDate.setHours(0, 0, 0, 0)
            return entryDate.getTime() === today.getTime()
          })

          if (!alreadyCompleted) {
            const updatedHistory = [
              ...(existing.completionHistory || []),
              { createdAt: new Date().toISOString() },
            ]

            await modelCollection.updateOne(
              { _id: existing._id },
              { $set: { completionHistory: updatedHistory } }
            )
          }

          return res.send({ message: 'Habit updated for user', updated: true })
        }

        const newHabit = {
          ...habit,
          ownerEmail: userEmail,
          ownerName: userName || 'Unknown User', 
          completionHistory: [{ createdAt: new Date().toISOString() }],
          createdAt: new Date(),
          public: false,
        }
        delete newHabit._id

        const result = await modelCollection.insertOne(newHabit)
        res.send({ message: 'Habit added for user', created: true, result })
      } catch (error) {
        console.error('Error completing habit:', error)
        res.status(500).json({ message: 'Server error' })
      }
    })

    // Update - PUT
    // UpdateOne
    // UpdateMany
    app.put('/habits/:id', async (req, res) => {
      const { id } = req.params
      const data = req.body
      const objectId = new ObjectId(id)
      const filter = { _id: objectId }
      const update = {
        $set: data,
      }
      const result = await modelCollection.updateOne(filter, update)
      res.send({
        success: true,
        result,
      })
    })

    // delete
    // deleteOne
    // deleteMany
    app.delete('/habits/:id', async (req, res) => {
      const { id } = req.params
      const objectId = new ObjectId(id)
      const filter = { _id: objectId }
      const result = await modelCollection.deleteOne(filter)
      res.send({
        success: true,
        result,
      })
    })

    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // await client.close();
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
