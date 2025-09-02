import express from "express";
import { handleExcelUpload, retrieveFileData, uploadToDatabase } from "./controller.js";

const router = express.Router();

router.post("/upload", handleExcelUpload);
router.get("/retrieve", retrieveFileData);
router.get("/uploadpostgres", uploadToDatabase);
router.get("/uploadmongodb", uploadToDatabase);

export default router;