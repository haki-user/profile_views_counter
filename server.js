const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const MDBURI = process.env.MDBURI;

let dbCon = false;
mongoose.connect(MDBURI).then(() => {
  dbCon = true;
  console.log("Connected to mongoDB");
}).catch((err) => {
  console.log(err);
});

const isDBCon = (req, res, next) => {
  if(dbCon) return next();
  res.sendStatus(500);
} 

const userSchema = new mongoose.Schema({
  username: String,
  view_ct: Number,
});

const User = mongoose.model("users", userSchema);

app.get("/", (req, res) => {
  res.send(`
    <form action="/users">
    <label>Secret<label>
    <input name=secret placeholder="Demon Lord">
    <button type="submit">get all users</button>
     </form>
     <h5>To count: &nbsp /pvc?username=</h5>
    `);
});

app.get("/pvc", isDBCon, async (req, res) => {
  const username = req.query.username;
  const user = await User.findOne({ username });
  if (user) {
      try {
        const count = user.view_ct;
        await User.findOneAndUpdate({ username }, { view_ct: count + 1 });
        res.json({ count });
    } catch(err) {
        console.log("Error updating userdata mongodb:", err);
        res.sendStatus(500);
    }
  } else {
    const a = await User.create({
      username,
      view_ct: 1,
    });
    res.json({ count: 1 });
  }
});

app.get("/users", isDBCon, async (req, res) => {
  const secret = req.query.secret;
  if (secret != (process.env.SECRET || "dd")) {
    res.status(403).send("Try again ;)");
  } else {
    const users = await User.find();
    res.json(users);
  }
});

app.use((req, res) => {
  res.send("Nothing");
});

app.listen(PORT, (err) => {
  if(err) return ("Error starting server:", err);
  console.log("Server running");
});

// /**
// * Paste one or more documents here
// */
// {
//     "_id": {
//       "$oid": "64a021d605101a7960065679"
//     },
//     "username": "Aditya",
//     "view_ct": 1
//   }
