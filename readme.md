# Manufacturing Sensor Data Backend

This project is a backend for processing real-time manufacturing sensor data from machines such as welding robots, stamping presses, CNC machines, AGVs, and more. The system provides APIs for receiving and tracking machine data, including the number of products produced.

## Setup

### 1. Set Up Environment Variables

Create a `.env` file in the root directory with the following content:

```plaintext
PORT=4000
MONGO_URI=mongodb+srv://younes:younes@cluster0.8fm7l.mongodb.net/sensorDb?retryWrites=true&w=majority
NODE_ENV=development

# Access token expiration: 1 day
JWT_ACCESS_EXPIRES_IN=3d

# Refresh token expiration: 7 days
JWT_REFRESH_EXPIRES_IN=7d

# Secret key for refresh tokens
JWT_REFRESH_SECRET=588c31563bd905cb46a15cca1ad7e83ef9810f4d23943ce65e1bef65ad5b351fe32d0c2442acc3add19ee0b7a58fe95b36ee6a0d502a95dd30abc1b1e60e21c3

# Secret key for access tokens
JWT_SECRET=b411c485b40b4966f4525d11de3fbdd370eca504693494265f45597edb9012b447e953d857dec02fc711e69767c01b3a530c2bae6bdedd63ee866c3bf259b62c




```

### 2.Install Dependencies

Run the following command to install the required packages:

```
npm install
```

### 3. Start the Server

Run the development server with:

```
npm run dev
// The server will start on http://localhost:4000.
```

4. Expose Server for Webhooks (Optional)
   To expose your local server for webhooks or external connections, you can use localtunnel:

```plaintext
lt --port 4000 --subdomain cool-api-project --local-host "localhost" -o --print-requests
```
