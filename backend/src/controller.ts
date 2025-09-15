import type { Request, Response } from "express";
import path from "path";
import { workbookToJson } from "./services/fileIngestorService.js";
import multer from "multer";
import { retrieveObjectFromMemory, saveObjectToMemory } from "./services/objectStorageService.js";
import { validateAllSheets, validateSheetData } from "./validation/validators.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { NoSQLDataSource, RDBMSDataSource } from "./db/data-sources.js";
import { CustomerPost } from "./db/CustomerPost.js";
import { CustomerMongo } from "./db/CustomerMongo.js";

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
            const { workBookName, sheets } = await workbookToJson(file.path, []);
            const validatedSheets = validateAllSheets(sheets);

            saveObjectToMemory(workBookName, validatedSheets);

            // Write file to storage
            //await fs.writeFile(validatedFilePath, JSON.stringify(validatedData, null, 2), "utf-8");

            res.status(200).json({
                message: "File Injested and validated",
                fileName: workBookName,
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

    const data = retrieveObjectFromMemory(fileName);

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

const rowToEntity = (row: any) => ({
    serial_number: row._index,
    customer_name: row["Customer Name"],
    number: row.Number ?? row.number,
    email: row.Email ?? row.email,
    time: row.Time ?? row.time,
});

export async function uploadToDatabase(req: Request, res: Response) {
    const fileName = req.query.filename as string;
    const db = req.path.includes("postgres") ? "postgres" : "mongodb";

    if (!fileName) {
        res.status(400).json({ error: "Invalid or missing file name" });
        return;
    }

    const data = retrieveObjectFromMemory(fileName);  

    if (!data) {
        res.status(404).json({ error: "Data not found" });
        return;
    }

    const validRecords = data.filter((row: any) => row._valid);

    if (!(validRecords.length > 0)) {
        res.status(400).json({ message: "No valid records to upload" });
        return;
    }

    try {
        let repo;
        if (db === "postgres") {
            if (!RDBMSDataSource.isInitialized) await RDBMSDataSource.initialize();
            repo = RDBMSDataSource.getRepository(CustomerMongo);
        }
        else {
            if (!NoSQLDataSource.isInitialized) await NoSQLDataSource.initialize();
            repo = NoSQLDataSource.getRepository(CustomerPost);
        }

        const entities = validRecords.map(rowToEntity).map(row => repo.create(row));
        await repo.insert(entities);
        
        res.status(200).json({
            message: `Successfully added ${entities.length} records to ${db}`
        })
    } catch (err) {
        res.status(500).json({
            error: "DB upload failed",
            details: (err as Error).message
        });
    }
}

export async function revalidate(req: Request, res: Response) {
    //console.log("req.body:", req.body);
    const filename = req.body.filename;
    const row = req.body.row;

    if (!filename || !row) {
        res.status(400).json({ error: "Missing data or filename" })
        return;
    }

    const data = retrieveObjectFromMemory(filename);

    if (data && data !== undefined && row !== -1) {
        const index = data.findIndex(record => row._index === record._index);
        data[index] = row;
        const validatedData = validateAllSheets(data);

        saveObjectToMemory(filename, validatedData);

        res.status(200).json({ message: "File changes saved" });
    } else {
        res.status(400).json({ error: "File data could not be modified" });
        return
    }
}