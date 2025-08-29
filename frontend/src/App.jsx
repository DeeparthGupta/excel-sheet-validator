import React, { useRef, useState } from "react";

function App() {
  const fileInputRef = useRef();
  const [result, setResult] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
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
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult("Upload failed: " + err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Upload Excel File</h1>
      <input type="file" ref={fileInputRef} disabled={uploading} />
      <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: 8 }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <pre style={{ background: "#f4f4f4", padding: 16, marginTop: 24 }}>{result}</pre>
    </div>
  );
}

export default App;