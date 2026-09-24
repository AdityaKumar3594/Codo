import express from "express";
import dotenv from "dotenv";
import connectDB  from "./config/db.js";
import router from "./routes/authRoutes.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
app.use(express.json());

app.use("/",router)


app.get("/", (req, res) => {
  res.json({message:"Auth service is running"} );
});

connectDB();

app.listen(PORT, () => {  
  console.log(`Auth service running on port ${PORT}`);
});
