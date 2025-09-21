import type { Request, Response } from "express";
import path from "path";
import { workbookToJson } from "./services/fileIngestorService.js";
import multer from "multer";
import { retrieveSheetFromWorkbook, retrieveWorkbookFromMemory, saveSheetInWorkbook, saveWorkbookToMemory } from "./services/SheetStorageService.js";
import { validateAllSheets, validateSheetData } from "./validation/validators.js";
import { fileURLToPath } from "url";
import { NoSQLDataSource, RDBMSDataSource } from "./db/data-sources.js";
import { CustomerPost } from "./db/CustomerPost.js";
import { CustomerMongo } from "./db/CustomerMongo.js";
import validateInterSheetRelations from "./validation/relationValidation.js";
import { ExcelRow, RelationConfig, RelationSetting, Sheet, Workbook } from "./types/types.js";
import fs from "fs";

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
            const uniqueColumns = parseFormDataStrings(req.body, "uniqueColumns");
            const keyMaps = parseFormDataStrings(req.body, "keyMaps");
            const relations = parseFormDataStrings(req.body, "relations");

            const validatedSheets = validateAllSheets(sheets, uniqueColumns);  
            const testArtifactsDir = path.join(currentDir, "..", "testArtifacts");
            if (!fs.existsSync(testArtifactsDir)) {
                fs.mkdirSync(testArtifactsDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const outFile = path.join(testArtifactsDir, `${workBookName}_${timestamp}-Intra.json`);
            fs.writeFileSync(outFile, JSON.stringify(validatedSheets, null, 2), "utf-8");

            if (relations && keyMaps) {
                const mainSheetName: string = "Main Table";
                const sheetMap: Map<string, Sheet> = new Map();
                for (const [name, rows] of validatedSheets.entries()) {
                    sheetMap.set(name, {
                        name: name,
                        keyColumn: keyMaps[name],
                        rows:rows
                    });
                }
                
                const relationConfig: RelationConfig = Object.fromEntries(
                    Object.entries(relations).map(([sheetName, config]) => {
                        return [sheetName, config as RelationSetting];
                    })
                ); 
                
                const interValidatedSheets = validateInterSheetRelations(
                    mainSheetName, sheetMap, relationConfig
                );
                saveWorkbookToMemory(workBookName, interValidatedSheets);
                const sheetNames = Array.from(interValidatedSheets.keys());

                res.status(200).json({
                    message: `${workBookName} ingested and validated. \n ${sheetNames.length} sheets found.`,
                    fileName: workBookName,
                    sheets: sheetNames
                });
                
                //console.log(`Saved sheets:`, Array.from(interValidatedSheets.keys()))

            } else {
                console.log("Relation config or KeyMaps are empty or undefined.");
                res.status(400).json({
                    error: "Relation config or KeyMaps are empty or undefined."
                })
            }
            

            //const data = retrieveObjectFromMemory(workBookName)
            //console.log(`Retrieved Keys: ${data ? Array.from(validatedSheets.keys()) : "No sheets seem to be saved"}`);

            // Write file to storage
            //await fs.writeFile(validatedFilePath, JSON.stringify(validatedData, null, 2), "utf-8");


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
    const sheets = req.query.sheets as string[] | undefined | null;

    if (!fileName) {
        res.status(400).json({ error: "Invalid or missing file name" });
        return;
    }

    const data = retrieveWorkbookFromMemory(fileName);

    if (!data) {
        res.status(404).json({ error: "No data for given file name" });
        return;
    }

    let result: Workbook;

    if (!sheets || (Array.isArray(sheets) && sheets.length === 0)) {
        result = data
    } else {
        result = new Map<string, Sheet>();
        for (const sheetName of sheets) {
            const sheetData = data.get(sheetName);
            if (sheetData !== undefined) {
                result.set(sheetName, sheetData);
            }
        }
    }

    const dataObject = Object.fromEntries(result);
    //console.log(`Filename: ${fileName} \n dataObject: ${JSON.stringify(dataObject, null, 2)}`)
    const testArtifactsDir = path.join(currentDir, "..", "testArtifacts");
    if (!fs.existsSync(testArtifactsDir)) {
        fs.mkdirSync(testArtifactsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outFile = path.join(testArtifactsDir, `${fileName}_${timestamp}-Inter.json`);
    fs.writeFileSync(outFile, JSON.stringify(dataObject, null, 2), "utf-8");
    res.status(200).json({
        message: "File data retrieved successfully.",
        filename: fileName,
        data: dataObject
    });
}

/* const rowToEntity = (row: any) => ({
    serial_number: row._index,
    customer_name: row["Customer Name"],
    number: row.Number ?? row.number,
    email: row.Email ?? row.email,
    time: row.Time ?? row.time,
}); */

export async function uploadToDatabase(req: Request, res: Response) {
    /* const fileName = req.query.filename as string;
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
    } */
}

export async function revalidate(req: Request, res: Response) {
    //console.log("req.body:", req.body);
    const filename = req.body.filename;
    const mainSheetName = req.body.mainSheet;
    const sheetName = req.body.sheetName;
    const relationConfig = req.body.relationConfig;
    const uniqueColumns = req.body.uniqueColumns;
    const row = req.body.row;

    if (!filename || !row || !sheetName) {
        res.status(400).json({ error: "Missing data or location" })
        return;
    }

    const sheet = retrieveSheetFromWorkbook(filename, sheetName);
    const mainSheet = retrieveSheetFromWorkbook(filename, mainSheetName)!;

    if (sheet && sheet !== undefined && sheet.rows.length > 0 && row !== -1) {
        const sheetData = sheet.rows;
        const index = sheetData.findIndex(record => row._index === record._index);
        sheetData[index] = row;
        const validatedSheetRows = validateSheetData(sheetData as ExcelRow[], uniqueColumns[sheetName] ?? []);
        sheet.rows = validatedSheetRows;
        
        const sheetsToValidate: Workbook = new Map();
        sheetsToValidate.set(sheet.name, sheet);
        sheetsToValidate.set(mainSheet.name, mainSheet);

        const interValidatedSheets = validateInterSheetRelations(mainSheetName, sheetsToValidate, relationConfig);
        for (const [sheetName, sheetData] of interValidatedSheets.entries()) {
            saveSheetInWorkbook(filename, sheetName, sheetData);
        }

        res.status(200).json({ message: "File changes saved" });
    } else {
        res.status(400).json({ error: "File data could not be modified" });
        return
    }
}

function parseFormDataStrings(body: any, fieldname: string) {
    const formData = body[fieldname];
    if (typeof formData === "string") {
        try {
            const result = JSON.parse(formData);
        } catch (e) {
            console.log(`Unable to parse ${fieldname}`)
            return undefined
        }
    }
    return formData;
}