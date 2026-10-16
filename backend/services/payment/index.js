import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({message:"payment service is running"} );
});

app.listen(PORT, () => {  
  connectDB()
  console.log(`payment service running on port ${PORT}`);
});
