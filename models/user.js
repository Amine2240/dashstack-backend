const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const UserSchema = new Schema({

    _id: { //mail
        type: String,
        required: true,
        ref: "chercheur"
    },
    username: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: "chercheur"
    }
}, { timestamps: true });

UserSchema.statics.login = async function ({email, password})
{
    
    
    if (!email|| !password)
    {
       throw new Error("Veuillez remplir tous les champs")
    }
    if(email.includes("@"))
    {   
        const user = await this.findOne({ _id: email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if ( isMatch) {
                return user;
            }
            else{

                throw new Error("Mot de passe incorrect")
            }
           
            }
    else{
        throw new Error("Email incorrect")
    }

 }
    else{
      
        const user = await this.findOne({ username: email });
        if (user) {
            
            const isMatch = await bcrypt.compare(password, user.password)
            if ( isMatch ) {
                return user;
            }
            else{
                throw new Error("Mot de passe incorrect")
            }
           
    }
    else{
        throw new Error("Nom d'utilisateur incorrect")
    
    }


}
}



UserSchema.statics.forgetPassword = async function ({email}){
    console.log(email)
    try {
    if (!email)
    {
        throw new Error("Veuillez entrer votre email")
    }
    const user = await this.findOne({ _id: email });
    if (user) {
        const token =  jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" })
        console.log(token)
        await sendMail(email, token)
        return user
    }
    else{
        throw new Error("Email incorrect")
    }
}
catch(err){
    throw new Error(err.message)
}

}



//create a function to send mail to the user to reset password 
const sendMail = async (email , token) => {
   
    const transporter = nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD
        }
    })
    const mailOptions = {
        from:process.env.EMAIL,
        to:email,
        subject:'Réinitialisation de mot de passe',
       // text:`Bienvenue monsieur ${nomComplet} dans la famille LMCS`,
        html :
        `<h1>Réinitialisation de mot de passe</h1>
        <p>Vous pouvez connecter à votre compte après changer votre mot de passe</p>
        <a href= http://localhost:5173/login/resetpassword/${token}>clique ici pour changer votre mot de passe </a>`

    }

    transporter.sendMail(mailOptions ,(err , info)=>{
        if(err){
            console.log('erreur:',err)
        }
        else{
            console.log('email sent :',info.response)
        }
    })


}


const User = mongoose.model("user", UserSchema);
module.exports = User;