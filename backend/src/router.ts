import express from "express";
import { handleExcelUpload, retrieveFileData, revalidate, uploadToDatabase } from "./controller.js";

const router = express.Router();

router.post("/upload", handleExcelUpload);
router.get("/retrieve", retrieveFileData);
router.get("/uploadpostgres", uploadToDatabase);
router.get("/uploadmongodb", uploadToDatabase);
router.post("/update", revalidate);

export default router;