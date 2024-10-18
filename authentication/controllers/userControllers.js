
require('dotenv').config()//import the dotenv package
const bcrypt = require('bcrypt')

const User = require('../../schema/User')//import the user model 
const Chercheur = require('../../schema/Chercheur')//import the chercheur model

//import the jsonwebtoken package to create a token for the user
const jwt = require('jsonwebtoken')

//create a function to create a token for the user
const createToken = require('../../ROUTERS/tools/generToken')


//create a function to handle the login request
const loginUser = async (req , res)=>{
    const {email , password} = req.body
    
   
    try {
        
        //use the login function from the user model to login the user
       const user = await User.login({email , password})
         
       //create a token for the user
       
       const token =  jwt.sign({email: user._id , type :user.type } , process.env.SECRET_KEY)
       console.log(token)
      // if(user.type ==="Admin"){return res.status(200).cookie('jwt' , token , {httpOnly: true , maxAge: 1000*60*60*24*3}).json({ type : user.type , email : user._id})}
       //send the user and token to the client and set the token in a cookie
       res.status(200).cookie('jwt' , token , {httpOnly: true , maxAge: 1000*60*60*24*3}).json({ type : user.type})

    }
    
    //catch any error that occurs during the login process
    catch(err){

        res.status(401).json({message: err.message})
    }
}


//create a function to handle the logout request
 const logoutUser = (req , res)=>{
    console.log(req.cookies.jwt)
    res.cookie('jwt' , '' , {maxAge: 1})
    res.status(200).json({message: "logout successful"})
    
  
 }



 //create a function to handle the forget password request
 const forgetPassword = async (req , res)=>{

     //grab the email from the request body
    const {email} = req.body

    try {
        //use the forgetPassword function from the user model to send the user a reset password link
        const user = await User.forgetPassword({email})
        res.status(200).json({message: "Un lien pour réinitialiser le mot de passe a été envoyé à votre mail."})
    }
    catch(err){
        //catch any error that occurs during the forget password process
        res.status(400).json({message: err.message})
    }

    

 }



 const resetPassword = async (req , res)=>{

    //get the password from the request body
    const {password} = req.body
  
    console.log(password)

    //get the id and token from the request parameters
    const {token} = req.params
    console.log(token )

    try {

        //verify the token
    const decoded =  jwt.verify(token , process.env.SECRET_KEY )

        //find the user by the id
        console.log(decoded)
        const user = await User.findById(decoded._id)

        //hash the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password , salt)


        //update the user password
        user.password = hashedPassword 

        //save the user with the new password 
         await user.save()

        //send a message to the client that the password has been reset
        res.status(200).json({message: "password reset successful"})

        // 200 is a status code for ok



 }
 catch(err){
    //catch any error that occurs during the reset password process
     res.status(400).json({message: err.message})

     // 400 is a status code for bad request 
 }

}



//export the loginUser function because it will be used in the loginRoute  and logout files
module.exports = {loginUser , logoutUser , forgetPassword , resetPassword}  