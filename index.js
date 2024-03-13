const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl);
//const port =process.env.PORT || 3000;


const userSchema = new mongoose.Schema({
  username: String
},{versionKey: false})
const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: Date,

})
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",async (req,res)=>{
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user = await userObj.save();
    res.json(user);
  }
  catch(err){
    console.error(err);
  }
})

app.post("/api/users/:_id/exercises",async(req,res)=>{
  const user_id = req.params._id;
  const date = req.body.date
  try{
    const user = await User.findById(user_id);
    if(!user){
      res.send("couldn't find user")
    } else {
      const exerciseObj = new Exercise({
        user_id: user_id,
        description: req.body.description,
        duration: req.body.duration,
        date: date ? new Date(date): new Date()
      })
      const exercise = await exerciseObj.save();
      res.json({
        _id : exercise.user_id,
        username: user.username,
        date: new Date(exercise.date).toDateString(),
        duration: exercise.duration,
        description: exercise.description,
        
      })
    }
  }
  catch(err){
    console.error(err)
  }
})

app.get("/api/users", async(req,res)=>{
  const user = await User.find({}).select("_id username");
  if(!user){
    res.send("no users")
  } else{
    res.json(user)
  }

})

app.get("/api/users/:_id/logs",async(req,res)=>{
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("no user")
    return
  }
  let dateObj = {}
  if(from){
    dateObj["$gte"]= new Date(from)
  }
  if(to){
    dateObj["$lte"]= new Date(to)
  }
  let filter = {
    user_id : id
  }
  if(from || to){
    filter.date = dateObj
  }
  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  let logs = exercises.map(e=>({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    logs,
  })

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
