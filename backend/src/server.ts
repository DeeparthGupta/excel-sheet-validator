import express from "express";
import router from "./router.js";
import cors from "cors";

const app = express()
const PORT = process.env.port || 3001;

app.use(cors());
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
