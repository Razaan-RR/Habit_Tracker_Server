const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')
const app = express()
const port = 3000
app.use(cors())
app.use(express.json())


// const uri = "mongodb+srv://habits-db:hufJP8Hj40cZj0Ty@clusterpractice.wzcrq6x.mongodb.net/?appName=ClusterPractice";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('habits-db')
    const modelCollection = db.collection('habits')

    // get method
    //find - find multiple data
    //findOne - find one particular document
    app.get('/habits', async (req, res) => {
      const result = await modelCollection.find().toArray() //promise
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
