const express = require("express");
const mongoose = require("mongoose");
const { makeBadge, ValidationError } = require('badge-maker'); 

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const MDBURI = process.env.MDBURI;

// Initialize database
let dbCon = false;
mongoose.connect(MDBURI).then(() => {
  dbCon = true;
  console.log("Connected to mongoDB");
}).catch((err) => {
  console.log(err);
});


const userSchema = new mongoose.Schema({
  username: String,
  view_ct: Number,
});

const User = mongoose.model("users", userSchema);

const isDBCon = (req, res, next) => {
  if(dbCon) return next();
  res.sendStatus(500);
}
 
// Update user count and add count to request
const updateUserCt = async (req, res, next) => {
  const username = req.query.username;
  if(!username) {
    return res.sendStatus(404);
  }
  // const regex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  // regex.test(username);
  const user = await User.findOne({ username });
  if (user) {
      try {
        const count = user.view_ct;
        await User.findOneAndUpdate({ username }, { view_ct: count + 1 });
        // res.json({ count });
        req.count = count;
        next();
    } catch(err) {
        console.log("Error updating userdata mongodb:", err);
        res.sendStatus(500);
    }
  } else {
    const a = await User.create({
      username,
      view_ct: 1,
    });
    // res.json({ count: 1 });
    req.count = 1;
    next();
  }
};

// Generate Badge
const genBadge = (options) => {
  const badge = makeBadge({...{
    label: 'Visitors count',
  }, ...options});
  return badge;
};

// Handle home route
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
    <html>
    <head>
      <meta name="google-site-verification" content="DVyun-8v_P9Lkep5YCjp7V0yjVSE7q_OmtL8E6tRpjw" />
    </head>
    <form action="/users">
    <label>Secret<label>
    <input name=secret placeholder="Demon Lord">
    <button type="submit">get all users</button>
     </form>
     <h5>To count (returns count): &nbsp /pvc?username=</h5>
     <h5>To get badge with count: &nbsp /pvcb?username=yourUsername<h5>
     <p>Optional: label,message,labelColor,color,style &nbsp /pvcb?username=value&color=red&labelColor=value<p>
     <p>ex: &nbsp <a href="https://countme.onrender.com/pvcb?username=someone&color=red&labelColor=blur"> https://countme.onrender.com/pvcb?username=someone&color=red&labelColor=blue <a> <p>
     <p>Github: &nbsp <a href="https://github.com/haki-user/profile_views_counter">https://github.com/haki-user/profile_views_counter</a>
     </html>
    `);
});

// Send badge
app.get('/pvcb', isDBCon, updateUserCt, (req, res) => {
  const { username, ...options } = req.query;

  const badge = genBadge({
    ...options,
    message: req.count.toString()
  });
  res.set('Content-Type', 'image/svg+xml');
  // res.set('Cache-Control', 'no-cache');
  res.set('Cache-control', 'max-age=0, no-cache, no-store, must-revalidate')
  // const uniqueUrl = `${badge}?timsestamp=${Date.now()}`;
  // res.send(uniqueUrl);
  res.set('ETag', `"${Date.now().toString()}"`);
  res.send(badge);
});

// send count
app.get("/pvc", isDBCon, updateUserCt, async (req, res) => {
  res.json({ count: req.count });
});

// send all users data
app.get("/users", isDBCon, async (req, res) => {
  const secret = req.query.secret;
  if (secret != (process.env.SECRET)) {
    res.status(403).send("Try again ;)");
  } else {
    const users = await User.find();
    res.json(users);
  }
});

// Unhandled routes
app.use((req, res) => {
  res.send("Nothing");
});

// start server
app.listen(PORT, (err) => {
  if(err) return ("Error starting server:", err);
  console.log("Server running");
});
