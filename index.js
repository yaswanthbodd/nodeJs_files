const express = require("express")
const mongoose = require("mongoose")
const dotEnv = require("dotenv")
const bodyParser = require("body-parser")
const ejs= require("ejs")
const cors=require("cors")
const session=require("express-session") // npm i express-session
const MongoDBStore=require('connect-mongodb-session')(session) //npm i connect-mongodb-session
const User=require('./model/User') // From the model folder
const bcrypt=require('bcryptjs')

const app = express()

dotEnv.config()

const PORT = process.env.PORT || 8000

//Set the Template Engine 
app.set('view engine','ejs')
app.use(express.static('public')) //Css Styling file 
app.use(express.urlencoded({extended:true})) //To store the data by using this middleware


//Session Registration


//MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB Connected Successfully...")
}).catch((error)=>{
    console.log(`${error}`)
})

//To store the Session in mongodb. To write Below Command:
const store= new MongoDBStore({
    uri:process.env.MONGO_URI,
    collection:"mySession"
})
app.use(session({
    secret:"This is a secret message",
    resave:false,
    saveUninitialized:true,
    store:store
}))

//Authentication Middleware
const checkAuth=(req,res,next)=>{
    if(req.session.isAuthicated){
        next()
    }else{
        res.redirect('/signup')
    }
}

//The below files are created in the views folder. These are ejs extension
app.get('/signup',(req,res)=>{
    res.render('register')
})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/dashboard',checkAuth,(req,res)=>{
    res.render('welcome')
})

//Creating the Routes
// app.post('/register',async(req,res)=>{
//     try{
//         const {username,email,password} = req.body

//         const newUser=new User({
//             username,
//             email,
//             password
//         })
//         await newUser.save()
//         req.session.personal = newUser.username
//         res.redirect('/login')
//     }catch(error){
//         console.log(`This is error ${error}`)
//         res.redirect('/signup')
//     }
// })

app.post('/register',async(req,res)=>{
    const {username,email,password} = req.body

    let user=await User.findOne({email})
    if(user){
        return res.redirect('/signup')
    }
    const hashedPassword= await bcrypt.hash(password,12)

    user = new User({
        username,
        email,
        password:hashedPassword
    })
    req.session.person = user.username //Session Created with Username
    await user.save()
    res.redirect('/login')
})


//Login Page Route
app.post('/user-login',async(req,res)=>{
    const {email,password}=req.body

    const user = await User.findOne({email})
    if(!user){
        return res.redirect('/signup')
    }
    const checkPassword = await bcrypt.compare(password,user.password)

    if(!checkPassword){
        return res.redirect('/signup')
    }
    req.session.isAuthicated = true
    res.redirect('/dashboard')
})

//logout
app.post('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err) throw err;
        res.redirect('/signup')
    })
})

//PORT Number Assign to the server
app.listen(PORT,(req,res)=>{
    console.log(`Server running and started at ${PORT}`)
})
