import React, { useState, useEffect } from "react";
import {
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { postRequest } from "../../../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../../../serverconfiguration/serverconfig";
import { REPORTS } from "../../../../serverconfiguration/controllers";
import { toast } from "react-toastify";
import Sidenav from "../../../Home Page-comapny/Sidenav1";
import Navbar from "../../../Home Page-comapny/Navbar1";

const PFvalues = () => {
  const [isloggedin] = useState(sessionStorage.getItem("user"));
  const [company, setCompany] = useState([]);
  const [rowData, setRowData] = useState([
    { id: 1, label: "Effective Month From", value: "" },
    { id: 2, label: "Effective From Year", value: "" },
    { id: 3, label: "PF Contribution (%)", value: "" },
    { id: 4, label: "Max Ceiling", value: "" },
    { id: 5, label: "Inc Earnings for PF value below ceiling", value: "" },
    { id: 6, label: "EPF Contribution (%)", value: "" },
    { id: 7, label: "Upper Limit", value: "" },
    { id: 8, label: "EPS Contribution (%)", value: "" },
    { id: 9, label: "Eligibility Amount", value: "" },
    { id: 10, label: "Admin Charges (%)", value: "" },
    { id: 11, label: "Rounding Options", value: "" },
  ]);
  const [originalRowData, setOriginalRowData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ Dynamic DB name

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleCellValueChange = (params) => {
    setRowData((prevData) =>
      prevData.map((row) =>
        row.id === params.data.id ? { ...row, value: params.data.value } : row
      )
    );
  };

  const columns = [
    {
      headerName: "FIELD",
      field: "label",
      flex: 1,
      minWidth: 150,
      cellStyle: { textAlign: "left", paddingRight: "10px" },
      headerClass: "ag-center-header",
    },
    {
      headerName: "VALUE",
      field: "value",
      editable: true,
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params || !params.data) return "";
        if (params.data.label.includes("%")) {
          const value = parseFloat(params.value);
          return isNaN(value) ? "" : `${value}%`;
        }
        if (params.data.label === "Effective From Year") {
          return parseInt(params.value, 10) || "";
        }
        const value = parseFloat(params.value);
        return !isNaN(value) ? value.toFixed(2) : params.value;
      },
      valueParser: (params) => {
        if (!params.newValue) return null;
        const numericValue = parseFloat(params.newValue);
        return isNaN(numericValue) ? 0 : numericValue;
      },
      cellStyle: { textAlign: "left", paddingLeft: "10px" },
      cellEditorSelector: (params) => {
        if (params.data.label === "Effective From Year") {
          const currentYear = new Date().getFullYear();
          const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
          return { component: "agSelectCellEditor", params: { values: years } };
        }
        if (params.data.label === "Effective Month From") {
          return { component: "agSelectCellEditor", params: { values: months } };
        }
        if (
          params.data.label === "Max Ceiling" ||
          params.data.label === "Inc Earnings for PF value below ceiling"
        ) {
          return { component: "agSelectCellEditor", params: { values: ["Yes", "No"] } };
        }
        if (params.data.label === "Rounding Options") {
          return {
            component: "agSelectCellEditor",
            params: { values: ["Rounded to Next Rupee", "Round to Nearest Rupee"] },
          };
        }
        return null;
      },
      headerClass: "ag-center-header",
    },
  ];

  // ✅ Fetch company and PF data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const companyResponse = await postRequest(ServerConfig.url, REPORTS, {
          query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company]
                  WHERE Company_User_Id = '${isloggedin}'`,
        });

        const companyData = companyResponse.data || [];
        setCompany(companyData);

        if (companyData.length > 0) {
          const pfSettingsQuery = `
            SELECT * FROM [${databaseName}].[dbo].[PF_Settings]
            WHERE pn_CompanyID = ${companyData[0].pn_CompanyID}
          `;
          const pfResponse = await postRequest(ServerConfig.url, REPORTS, { query: pfSettingsQuery });
          const pfData = pfResponse.data || [];

          if (pfData.length > 0) {
            const updatedRowData = rowData.map((row) => {
              const map = {
                "Effective Month From": "Effective_Month_From",
                "Effective From Year": "Effective_From_Year",
                "PF Contribution (%)": "PF_Contribution(%)",
                "Max Ceiling": "Max_Ceiling",
                "Inc Earnings for PF value below ceiling": "PF_below_ceiling",
                "EPF Contribution (%)": "EPF_Contribution(%)",
                "Upper Limit": "Upper_Limit",
                "EPS Contribution (%)": "EPS_Contribution(%)",
                "Eligibility Amount": "Eligibility_Amount",
                "Admin Charges (%)": "Admin_Charges(%)",
                "Rounding Options": "Rounding_Options",
              };
              const dbCol = map[row.label];
              return { ...row, value: pfData[0][dbCol] || "" };
            });
            setRowData(updatedRowData);
            setOriginalRowData(JSON.parse(JSON.stringify(updatedRowData)));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    if (isloggedin && databaseName) fetchData();
  }, [isloggedin, databaseName]);

  // ✅ Save PF settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      toast.dismiss();

      const requiredFields = [
        "Effective Month From",
        "Effective From Year",
        "PF Contribution (%)",
        "EPF Contribution (%)",
        "EPS Contribution (%)",
        "Admin Charges (%)",
      ];

      const missing = rowData.filter(
        (r) =>
          requiredFields.includes(r.label) &&
          (r.value === "" || r.value === null)
      );

      if (missing.length > 0) {
        toast.error("Please fill all required fields before saving.");
        return;
      }

      const hasChanges = rowData.some(
        (row, index) => row.value !== originalRowData[index]?.value
      );
      if (!hasChanges) {
        toast.info("No changes detected.");
        return;
      }

      const data = rowData.reduce((acc, row) => {
        acc[row.label] = row.value;
        return acc;
      }, {});

      const companyID = company[0]?.pn_CompanyID;
      const checkQuery = `
        SELECT COUNT(*) as count FROM [${databaseName}].[dbo].[PF_Settings]
        WHERE pn_CompanyID = ${companyID}
      `;
      const checkResponse = await postRequest(ServerConfig.url, REPORTS, { query: checkQuery });
      const exists = checkResponse.data[0]?.count > 0;

      const query = exists
        ? `
          UPDATE [${databaseName}].[dbo].[PF_Settings]
          SET Effective_Month_From = '${data["Effective Month From"]}',
              Effective_From_Year = ${data["Effective From Year"]},
              [PF_Contribution(%)] = ${data["PF Contribution (%)"]},
              Max_Ceiling = '${data["Max Ceiling"]}',
              PF_below_ceiling = '${data["Inc Earnings for PF value below ceiling"]}',
              [EPF_Contribution(%)] = ${data["EPF Contribution (%)"]},
              Upper_Limit = ${data["Upper Limit"] || "NULL"},
              [EPS_Contribution(%)] = ${data["EPS Contribution (%)"]},
              Eligibility_Amount = ${data["Eligibility Amount"] || "NULL"},
              [Admin_Charges(%)] = ${data["Admin Charges (%)"]},
              Rounding_Options = '${data["Rounding Options"]}'
          WHERE pn_CompanyID = ${companyID}`
        : `
          INSERT INTO [${databaseName}].[dbo].[PF_Settings]
          (pn_CompanyID, Effective_Month_From, Effective_From_Year, [PF_Contribution(%)],
          Max_Ceiling, PF_below_ceiling, [EPF_Contribution(%)], Upper_Limit,
          [EPS_Contribution(%)], Eligibility_Amount, [Admin_Charges(%)], Rounding_Options)
          VALUES (${companyID}, '${data["Effective Month From"]}', ${data["Effective From Year"]},
          ${data["PF Contribution (%)"]}, '${data["Max Ceiling"]}', 
          '${data["Inc Earnings for PF value below ceiling"]}', 
          ${data["EPF Contribution (%)"]}, ${data["Upper Limit"] || "NULL"},
          ${data["EPS Contribution (%)"]}, ${data["Eligibility Amount"] || "NULL"},
          ${data["Admin Charges (%)"]}, '${data["Rounding Options"]}')`;

      await postRequest(ServerConfig.url, REPORTS, { query });

      toast.success(exists ? "PF settings updated successfully!" : "PF settings saved successfully!");
    } catch (error) {
      console.error("Error saving PF settings:", error);
      toast.error("Failed to save PF settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Grid container style={{ backgroundColor: "#f5f5f5" }}>
      <Grid item xs={12}>
        <Navbar />
      </Grid>
      <Grid item xs={12} sx={{ display: "flex" }}>
        <Sidenav />
        <Grid item xs={12} sm={10} md={8} lg={7} sx={{ padding: "40px", margin: "0 auto" }}>
          <AppBar position="static" sx={{ marginTop: "70px", minHeight: "60px" }}>
            <Toolbar>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "white" }}>
                PF SETTINGS
              </Typography>
            </Toolbar>
          </AppBar>

          <Box sx={{ mt: 4 }}>
            <div className="ag-theme-alpine" style={{ width: "100%", overflowY: "auto" }}>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                  <CircularProgress />
                </Box>
              ) : (
                <AgGridReact
                  columnDefs={columns}
                  rowData={rowData}
                  onCellValueChanged={handleCellValueChange}
                  domLayout="autoHeight"
                  getRowHeight={() => 35}
                  getRowStyle={(params) => ({
                    backgroundColor: params.node.rowIndex % 2 === 0 ? "#e3f2fd" : "#ffffff",
                  })}
                />
              )}
            </div>

            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PFvalues;
