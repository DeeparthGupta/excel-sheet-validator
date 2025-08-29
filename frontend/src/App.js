import React, { useEffect, useRef, useState } from "react";
import "frappe-datatable/dist/frappe-datatable.min.css";
import DataTable from "frappe-datatable";

function App() {
	const fileInputRef = useRef();
	const tableRef = useRef();
  	const [result, setResult] = useState("");
  	const [uploading, setUploading] = useState(false);
  	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [filename, setFileName] = useState("");
	const [rows, setRows] = useState([]);


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
	  		const response = await fetch("http://localhost:3001/upload", {
				method: "POST",
				body: formData,
	  		});
			const responseData = await response.json();

			if (response.ok && responseData.fileName) {
				setFileName(responseData.fileName);
				console.log(`File Name: ${responseData.fileName}`);
			}

		} catch (err) {
	  		setResult("Upload failed: " + err);
		} finally {
			setUploading(false);
			setResult("Upload Successful");
		}
  	};

	const retrieveData = async (filename) => {
		try {
			const response = await fetch(`http://localhost:3001/retrieve?filename=${filename}`);
			const responseData = await response.json();

			if (response.ok && responseData.data.length > 0) {
				setData(responseData.data);
				setResult("Data retrieved");
			} else {
				setResult("Failed to retrieve data:" + response.error);
			}
		} catch (err) {
			setResult("Unable to retrieve data:" + err);
		}
	}

	const processDataForFrappe = (data) => {
		const columns = Object.keys(data[0] || {}).map((key) => ({
			name: key,
			editable: true,
			id: key
		}));

		const rows = data.map(row =>
			columns.map(col =>
				String(row[col.id] ?? "")
			)
		);
		
		console.log("Columns:", JSON.stringify(columns,null,2));
		console.log("Rows:", JSON.stringify(rows,null,2));

		setColumns(columns);
		setRows(rows);
	}

	useEffect(() => {
		if (filename) {
			retrieveData(filename);
		}
	}, [filename]);
	
	useEffect(() => {
		if (data.length > 0) {
			processDataForFrappe(data)
		}
	}, [data]);

	useEffect(() => {
		if (rows.length > 0 && columns.length > 0 && tableRef.current) {
			tableRef.current.innerHTML = "";

			new DataTable(tableRef.current, {
				columns: columns,
				data:rows
			});
		}
	},[rows,columns]);


	return (
		<div style={{ maxWidth: 600, margin: "2rem auto" }}>
			<h2>Upload Excel File</h2>
			<input type="file" ref={fileInputRef} disabled={uploading} accept=".xlsx" />
			<button onClick={fileUpload} disabled={uploading} style={{ marginLeft: 8, border:"1px solid #000" }}>
				{uploading ? "Uploading..." : "Upload"}
			</button>
			<pre style={{ background: "#f4f4f4", padding: 16, marginTop: 24 }}>{result}</pre>
			{data.length > 0 && (
				<div style={{ marginTop: 24 }}>
					<h4>Sheet Contents</h4>
					<div ref={tableRef} />
				</div>
			)}
		</div>
	);
}

export default App;