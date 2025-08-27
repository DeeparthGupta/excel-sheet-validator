import type{ Request, Response } from "express";
import path from "path";
import { convertExcelToJson } from "./fileInjestor.js";
import multer from "multer";
import { error } from "console";


/* export interface FileRequest extends Request {
  file: Express.Multer.File;
} */

const uploads_dir = path.join(__dirname, "..", "uploads");
const upload = multer({ dest: uploads_dir }).single("file");

export async function handleExcelUpload(req: Request, res: Response): Promise<void> {
    upload(req, res, async function (err) {
        const file = (req as Request & { file: Express.Multer.File }).file;
        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        if (err) {
            res.status(500).json({ error: "File upload failed" });
            return;
        }

        try {
            const jsonPath = await convertExcelToJson(file.path, uploads_dir);
            res.status(200).json({ message: "File Injested", jsonPath });
        } catch (e) {
            res.status(500).json({
                error: "Injestion Failed",
                details: (e as Error).message
            });
        }
        
    });
}