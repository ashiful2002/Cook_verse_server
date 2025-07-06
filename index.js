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
    // await client.connect();

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

    //  Get all recipes or filter by email
    app.get("/recipes", async (req, res) => {
      const email = req.query.email;
      const query = email ? { email } : {};
      const result = await recipeCollection.find(query).toArray();
      res.send(result);
    });
    ////////////////////////// /////////
    app.get("/recipes", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query.email = email;
      }

      try {
        const recipes = await recipeCollection.find(query).toArray();
        res.send(recipes);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch " });
      }
    });

    // Add a new recipe
    app.post("/recipes", async (req, res) => {
      const newRecipe = req.body;
      const result = await recipeCollection.insertOne(newRecipe);
      res.send(result);
    });

    app.get("/recipes/top-liked", async (req, res) => {
      try {
        const topRecipes = await recipeCollection
          .find()
          .sort({ likeCount: -1 }) // highest to lowest
          .limit(6) // only top 6
          .toArray();

        res.send(topRecipes);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch top liked recipes" });
      }
    });

    //  Like a recipe (update like count)
    app.patch("/recipes/:id/like", async (req, res) => {
      const { id } = req.params;
      const { likeCount } = req.body;
      const result = await recipeCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { likeCount: String(likeCount) } }
      );
      res.send(result);
    });

    //Get a single recipe by ID
    app.get("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const recipe = await recipeCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!recipe) {
          return res.status(404).send({ error: "Recipe not found" });
        }
        res.send(recipe);
      } catch (error) {
        res.status(500).send({ error: "Server error" });
      }
    });

    /// ////// /////// /////

    // update data by patch

    app.patch("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;

      try {
        const result = await recipeCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({ error: "No recipe updated" });
        }

        res.send({ message: "recipe updated !", result });
      } catch (error) {
        res.status(500).send({ err: "Updated failed" });
      }
    });

    // delete recipe by user
    app.delete("/recipes/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await recipeCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).send({ error: "recipe not found" });
        } else {
          res.send({ message: "Recipe Deleted successfully " });
        }
      } catch (err) {
        res.status(500).send({ error: "Failed to delete recipe" });
      }
    });

    //////////
    // await client.db("admin").command({ ping: 1 });
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
