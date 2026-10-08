import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import router from "./routes/file.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

app.use(express.json());
app.use("/",router)

app.get("/", (req, res) => {
  res.json({message:"file service is running"} );
});

connectDB();

app.listen(PORT, () => {  
  console.log(`file service running on port ${PORT}`);
});
