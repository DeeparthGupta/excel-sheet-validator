import type{ Request, Response } from "express";
import path from "path";
import { convertExcelToJson } from "./fileInjestor.js";
import multer from "multer";
import { saveFileToMemory } from "./fileStore.js";
import { validateFileData } from "./validators.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";


/* export interface FileRequest extends Request {
  file: Express.Multer.File;
} */

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(currentDir, "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage }).single("file");

export async function handleExcelUpload(req: Request, res: Response): Promise<void> {
    upload(req, res, async function (err: any) {
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
            const { outputPath, data } = await convertExcelToJson(file.path, uploadsDir);
            const validatedData = validateFileData(data);
            saveFileToMemory(path.basename(outputPath), validatedData);

            const validatedFileName = path.basename(outputPath, ".json") + "-validated.json";
            const validatedFilePath = path.join(uploadsDir, validatedFileName);

            await fs.writeFile(validatedFilePath, JSON.stringify(validatedData, null, 2), "utf-8");

            res.status(200).json({ message: "File Injested and validated", outputPath, validatedFilePath });
        } catch (e) {
            res.status(500).json({
                error: "Injestion or validation failed",
                details: (e as Error).message
            });
        }
        
    });
}