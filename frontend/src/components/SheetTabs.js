import { Tabs, Tab, Box } from "@mui/material";
import DataTableComponent from "./DataTableComponent";
const { useState } = require("react");

function SheetTabs({data, gridRefs, excludedFields, onCellValueChanged}) {
    const sheetNames = Object.keys(data);
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [tabHasMatch, setTabHasMatch] = useState({});

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Each data table component calls this to report if it has a match 
    const handleHasMatch = (tabIndex, hasMatch) => {
        setTabHasMatch(prev => ({ ...prev, [tabIndex]: hasMatch }));
    };

    return (
        <Box sx={{ width: "100%"}}>
            <input
                type="text"
                placeholder={`Search Table`}
                value={searchQuery}
                onChange={text => setSearchQuery(text.target.value)}
                style={{marginBottom: 8, width:"50%"}}
            />
            <Tabs 
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Sheet-Tabs"
            >
                {sheetNames.map((name, index) =>( 
                    <Tab
                        key={name}
                        label={name}
                        sx={{fontWeight: tabHasMatch[index] ? "bold" : ""}}
                    />
                ))}
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {sheetNames.map((name, idx) => (
                    <Box
                        key={name}
                        hidden={idx !== activeTab}
                        sx={{width:"100%"}}
                    >
                        <DataTableComponent
                            rows={data[name]}
                            tableRef={table => { gridRefs.current[name] = table; }}
                            excludedFields={ excludedFields }
                            onCellValueChanged={ params => onCellValueChanged(params, name)}
                            searchQuery={searchQuery}
                            onHasMatch={hasMatch => handleHasMatch(idx, hasMatch)}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default SheetTabs