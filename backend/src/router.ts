import express from "express";
import { handleExcelUpload, retrieveFileData } from "./controller.js";

const router = express.Router();

router.post("/upload", handleExcelUpload);
router.get("/retrieve", retrieveFileData);

export default router;