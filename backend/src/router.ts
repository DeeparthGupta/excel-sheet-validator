import express from "express";
import { handleExcelUpload } from "./controller.js";

const router = express.Router();

router.post("/upload", handleExcelUpload);

export default router;