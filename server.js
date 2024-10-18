const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')    
const sendNotification = require('./utils/sendNotifications')

const app = express()
app.use(cors())
app.use(express.json())
app.use(bodyParser.json())
let userTokens = [];

app.post('/register-token', (req, res) => {

  const { token } = req.body;

  if (token && !userTokens.includes(token)) {
    userTokens.push(token);
    console.log('Token registered:', token);
  }
  res.status(200).send({ message: 'Token registered' });
});

app.get('/',(req,res)=>{
    res.send('Hello World')
})

//this is just for testing purpose
app.post('/send-notification', async (req, res) => {
  const { title, body } = req.body;
  const message = { title, body };

  // Iterate over all registered tokens and send the notification
  for (const token of userTokens) {
    await sendNotification(token, message);
  }

  res.status(200).send({ message: 'Notifications sent' });
});




app.listen(3000,()=>{
    console.log('Server is running on port 3000')
})