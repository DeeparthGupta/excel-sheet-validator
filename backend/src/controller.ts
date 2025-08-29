import type { Request, Response } from "express";
import path from "path";
import { convertExcelToJson } from "./services/fileInjestorService.js";
import multer from "multer";
import { retrieveFileFromMemory, saveFileToMemory } from "./services/fileStorageService.js";
import { validateFileData } from "./validation/validators.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { error } from "console";


/* export interface FileRequest extends Request {
  file: Express.Multer.File;
} */

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(currentDir, "..", "uploads");

// Multer setup to store files using file name
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

            // Data validation
            const validatedData = validateFileData(data);
            const validatedFileName = path.basename(outputPath, ".json") + "-validated.json";
            const validatedFilePath = path.join(uploadsDir, validatedFileName);

            saveFileToMemory(file.originalname, validatedData);

            // Write file to storage
            await fs.writeFile(validatedFilePath, JSON.stringify(validatedData, null, 2), "utf-8");

            res.status(200).json({
                message: "File Injested and validated",
                fileName: file.originalname,
            });
        } catch (e) {
            res.status(500).json({
                error: "Injestion or validation failed",
                details: (e as Error).message
            });
        }

    });
}

export async function retrieveFileData(req: Request, res: Response) {
    const fileName = req.query.filename as string;

    if (!fileName) {
        res.status(400).json({ error: "Invalid or missing file name" });
        return;
    }

    const data = retrieveFileFromMemory(fileName);

    if (!data) {
        res.status(404).json({ error: "No data for given file name" });
        return;
    }

    res.status(200).json({
        message: "File data retrieved successfully.",
        filename: fileName,
        data: data
    });
}