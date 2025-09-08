import { useState } from "react";


function DBUploadComponent({ filename, targetServer }) {
    const [uploadTarget, setuploadTarget] = useState("postgres");
    const [uploadDbResult, setUploadDbResult] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    
    const dbSelection = (e) => {
        setuploadTarget(e.target.value);
    };
        
    const uploadToDB = async () => {
        setIsUploading(true);
        try {
            const response = await fetch(`${targetServer}/upload${uploadTarget}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename }),
            });
            const result = await response.json();
            setUploadDbResult(result.message || "Upload successful");
        } catch (error) {
            setUploadDbResult(`Failed to upload to database: ${error}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{margin: "16px 0"}}>
            <label>
                <input 
                    type="radio"
                    name="uploadTarget"
                    value="postgres"
                    checked={uploadTarget === "postgres"}
                    onChange={dbSelection}
                    disabled={isUploading}

                />
                Upload to Postgres
            </label>
            <label style={{marginLeft: 16}}>
                <input
                    type="radio"
                    name="uploadTarget"
                    value="mongo"
                    checked={uploadTarget === "mongo"}							
                    onChange={dbSelection}
                    disabled={isUploading}
                />
                Upload to MongoDB
            </label>
            <button
                onClick={uploadToDB}
                style={{ marginLeft: 16, border: "1px solid #000" }}
                disabled={!filename || isUploading}
            >Upload to DB</button>
            {uploadDbResult && (
                <pre style={{ background: "#f4f4f4", padding: 8, marginTop: 12 }}>{uploadDbResult}</pre>
            )}              
        </div>
    );
}

export default DBUploadComponent;