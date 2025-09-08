import { useRef } from "react";

function FileUploader({targetServer, setUploading, setFileName, uploading, setResult}) {
    const fileInputRef = useRef();

    const fileUpload = async () => {
		const file = fileInputRef.current.files[0];
		if (!file) {
	  		alert("Please select a file.");
	  		return;
		}
		const formData = new FormData();
		formData.append("file", file);

		setUploading(true);
		setResult("Uploading...");

		try {
	  		const response = await fetch(`${targetServer}/upload`, {
				method: "POST",
				body: formData,
	  		});
			const responseData = await response.json();

			if (response.ok && responseData.fileName) {
				setFileName(responseData.fileName);
				//console.log(`File Name: ${responseData.fileName}`);
			}
		} catch (err) {
	  		setResult("Upload failed: " + err);
		} finally {
			setUploading(false);
			setResult("Upload Successful");
		}
    };
    
    return (
        <>
            <input type="file" ref={fileInputRef} disabled={uploading} accept=".xlsx" />
            <button onClick={fileUpload} disabled={uploading} style={{ marginLeft: 8, border:"1px solid #000" }}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
        </>
    );
}

export default FileUploader;