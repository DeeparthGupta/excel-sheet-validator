import express from "express";
import { handleExcelUpload, retrieveFileData, revalidate, uploadToDatabase } from "./controller.js";

const router = express.Router();

router.post("/upload", handleExcelUpload);
router.get("/retrieve", retrieveFileData);
router.post("/uploadpostgres", uploadToDatabase);
router.post("/uploadmongodb", uploadToDatabase);
router.post("/update", revalidate);

export default router;