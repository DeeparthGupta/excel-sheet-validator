import DataTable from "frappe-datatable";
import { useEffect, useRef } from "react";

function DataTableComponent({ rows, columns, revalidate }) {
    const tableDivRef = useRef();
	const tableRef = useRef();
	
	/* const applyStyleToRow = (rowData, rowIndex) => {
    // Set styles
		if (rowData._valid) {
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: 'transparent'
			});
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#77e977ff'
			});
		} else if (!rowData._valid) {
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#transparent'
			});
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#f0b6b6ff'
			});

			// Use direct DOM manipulation because cell styles don't change after initial change.
			rowData._errors.forEach(key => {
				const columnIndex = columns.findIndex(col => col.id === key);
				const cellSelector = `.dt-cell--row-${Number(rowIndex)}.dt-cell--col-${columnIndex}`;
				const cells = document.querySelectorAll(cellSelector);
				cells.forEach(cell => cell.style.background = 'transparent');
				cells.forEach(cell => cell.style.background = '#f72424ff');
			});
		}
    
	} */

	const applyRowStyle = (rowIndex, isValid) => {
		const rowSelector = `.dt-cell--row-${Number(rowIndex)}`;
		tableRef.current.style.setStyle(rowSelector, {
			background: "transparent"
		});
		tableRef.current.style.setStyle(rowSelector, isValid
			? { background: "#77e977ff" }
			: { background: "#f0b6b6ff" }
		);
	};

	const applyCellStyle = (rowIndex, colIndex) => {
		const cellSelector = `.dt-cell--row-${Number(rowIndex)}.dt-cell--col-${colIndex}`;
		const cells = document.querySelectorAll(cellSelector);
		cells.forEach(cell => cell.style.background = "transparent");
		cells.forEach(cell => cell.style.background = '#f72424ff');
	}

	useEffect(() => {
		const applyStyles = (tableData) => {
			tableData.forEach((rowData, rowIndex) => {
				applyRowStyle(rowIndex, rowData._valid);
				rowData._errors.forEach(key => {
					const colIndex = columns.findIndex(col => col.id === key);
					applyCellStyle(rowIndex, colIndex);
				});
			});
		}

		if (columns.length > 0 && rows.length > 0 && tableDivRef.current) {
			if (tableRef.current){
				tableRef.current.refresh(rows, columns);
				setTimeout(() => applyStyles(rows), 0);
			}/*  else if (rows <= 0 || columns <= 0 || !Array.isArray(rows) || !Array.isArray(rows)) {
				console.log(`Invalid data: \n
					Is row an array: ${Array.isArray(rows)} \n
					Is Columns an array: ${Array.isArray(columns)} \n
					Row Length: ${rows.length}
					Column Length: ${columns.length}
					Column Data: ${columns}
					First 2 rows: ${rows[0]} \n ${rows[1]}`);
			} */ else {
				//console.log(rows);
				tableRef.current = new DataTable(tableDivRef.current, {
					columns: columns,
					data: rows,
					serialNoColumn: false,
					getEditor(colIndex, rowIndex, value, parent, column, row, rowdata) {
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
								const rowCopy = { ...rowdata };
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