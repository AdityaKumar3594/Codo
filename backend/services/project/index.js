import express from "express";
import dotenv from "dotenv";
import connectDB  from "./config/db.js";
import router from "./routes/project.route.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(express.json());
app.use("/",router)

app.get("/", (req, res) => {
  res.json({message:"Project service is running"} );
});

connectDB();

app.listen(PORT, () => {  
  console.log(`Project service running on port ${PORT}`);
});
