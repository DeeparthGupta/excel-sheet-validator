import DataTable from "frappe-datatable";
import "frappe-datatable/dist/frappe-datatable.min.css";
import { useEffect, useRef } from "react";

function DataTableComponent({ rows, columns, revalidate }) {
    const tableDivRef = useRef(); //Ref for the table container
	const tableRef = useRef(); // Ref for the table itself

	const applyRowStyle = (rowIndex, isValid) => {
		const rowSelector = `.dt-cell--row-${Number(rowIndex)}`;
		// Reset color just in case
		tableRef.current.style.setStyle(rowSelector, {
			background: "transparent"
		});
		tableRef.current.style.setStyle(rowSelector, isValid
			? { background: "#77e977ff" }
			: { background: "#f0b6b6ff" }
		);
	};

	const applyCellStyle = (rowIndex, colIndex) => {
		// Use DOM operation to set cell colors because the API behaves unpredictability
		const cellSelector = `.dt-cell--row-${Number(rowIndex)}.dt-cell--col-${colIndex}`;
		const cells = document.querySelectorAll(cellSelector);
		cells.forEach(cell => cell.style.background = "transparent");
		cells.forEach(cell => cell.style.background = '#f72424ff');
	}

	useEffect(() => {
		const applyStyles = (tableData) => {
			tableData.forEach((rowData, rowIndex) => {
				applyRowStyle(rowIndex, rowData._valid);
				// Iterate through the errors arry
				rowData._errors.forEach(key => {
					const colIndex = columns.findIndex(col => col.id === key);
					applyCellStyle(rowIndex, colIndex);
				});
			});
		};

		if (columns.length > 0 && rows.length > 0 && tableDivRef.current) {
			if (tableRef.current){
				tableRef.current.refresh(rows, columns);
				setTimeout(() => applyStyles(rows), 0);
			} else {
				tableRef.current = new DataTable(tableDivRef.current, {
					columns: columns,
					data: rows,
					serialNoColumn: false,
					getEditor(colIndex, rowIndex, value, parent, column, row, rowdata) {
						// Create an input element to enter new data
						const $input = document.createElement('input');
						$input.type = 'text';
						$input.value = value;
						parent.appendChild($input)

						return {
							initValue(value) {
								$input.value = value;
								$input.focus();
							},
							setValue(value) {
								$input.value = value;
							},
							getValue(value) {
								// Create a copy of the row whose sell is being edited
								const rowCopy = { ...rowdata };
								// Read the input element, set it's value in the cell 
								// and pass it to the revalidate function
								rowCopy[column["id"]] = $input.value;
								revalidate(rowCopy);
								return $input.value;
								
							}
						}
					}
				});
				setTimeout(() => applyStyles(rows), 0);
			}	

		}
    }, [columns, rows, revalidate]);
    
    return (
        <div ref={tableDivRef} />
    );
}

export default DataTableComponent;