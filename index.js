const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // database create for users
    const database = client.db("usersdb");
    const usersCollection = database.collection("users");

    // creating databse for recipe
    const recipedb = client.db("recipedb");
    const recipeCollection = recipedb.collection("recipe");

    // get users from databser
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // post users to database
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    //  recipe related database

    // get recipe form  databse filtered by email
    app.get("/recipes", async (req, res) => {
      const cursor = recipeCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // post data in mongodb
    app.post("/recipes", async (req, res) => {
      const userEmail = req.query.body;
      try {
        let query = {};
        if (userEmail) {
          query.email = userEmail;
        }
        const recipes = await Recipe.find(query);
        res.status(201).json(result);
      } catch (error) {}
    });
    // update recipe data to like count
    app.get("/recipes", async () => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const recipes = await Recipe.find(query);
      res.json(recipes);
    });
    app.patch("/recipes/:id/like", async (req, res) => {
      const { id } = req.params;
      const { likeCount } = req.body;
      const result = await recipeCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { likeCount: String(likeCount) } }
      );
      res.send(result);
    });

    // to receive data from database and send to frontend

    app.get("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const recipe = await recipeCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!recipe) {
          return res.status(404).send({ error: "Recipe not found" });
        } else {
          res.send(recipe);
        }
      } catch (error) {
        res.status(500).send({ error: "server error" });
      }
      //   console.log(id);
    });

    // post users data to database
    app.post("/recipes", async (req, res) => {
      const newRecipe = req.body;
      const result = await recipeCollection.insertOne(newRecipe);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Root
app.get("/", (req, res) => {
  res.send("Hello World this is working !");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
