const express = require('express')

//import the loginUser , logoutUser and forgetPassword functions from the userControllers file
const {loginUser , logoutUser , forgetPassword , resetPassword} = require('../controllers/userControllers')

const authRouter = express.Router()

//create a post request to the login route and use the loginUser function to handle the request
authRouter.post('/login' , loginUser )



authRouter.get('/logout' , logoutUser )//create a get request to the logout route and use the logoutUser function to handle the request

const session = require('express-session')//import the express-session package
authRouter.use(session({//use the express-session package to create a session
    secret:'jdokjgoi',
    resave: false,
    saveUninitialized: true

}))

 




//create a post request to the forgetpassword route and use the forgetPassword function to handle the request
authRouter.post('/forget-password' , forgetPassword )



//create a patch request to the resetpassword route and use the resetPassword function to handle the request and make new password
authRouter.post('/reset-password/:token' , resetPassword )


module.exports = authRouter//export the router to be used in the server file


