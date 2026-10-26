import React, { useState, useEffect } from "react";
import {
  Grid,
  Button,
  Typography,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import Navbar from "../Home Page-comapny/Navbar1";
import Sidenav from "../Home Page-comapny/Sidenav1";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { toast } from "react-toastify";

const PaymLeaveMaster1 = () => {
  const [company, setCompany] = useState([]);
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [isloggedin, setIsloggedin] = useState(sessionStorage.getItem("user"));
  const [filteredData, setFilteredData] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openView, setOpenView] = useState(false);
  const [viewData, setViewData] = useState(null);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ Dynamic DB name

  const fetchCompanyData = async () => {
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company]
        WHERE company_user_id = '${isloggedin}'`,

    });
    setCompany(companyData.data);
    if (companyData.data.length > 0)
      setPnCompanyId(companyData.data[0].pn_CompanyID);
  };

  const fetchBranchData = async () => {
    if (pnCompanyId) {
      const branchData = await postRequest(ServerConfig.url, REPORTS, {
        query: `SELECT * FROM [${databaseName}].[dbo].[paym_Branch]
        WHERE pn_CompanyID = '${pnCompanyId}'`,

      });
      setBranch(branchData.data);
    }
  };

  const fetchLeaveData = async () => {
    if (pnCompanyId) {
      const leaveData = await postRequest(ServerConfig.url, REPORTS, {
        query: `SELECT * FROM [${databaseName}].[dbo].[paym_Leave]
        WHERE pn_CompanyID = '${pnCompanyId}'`,

      });

      const formattedData = leaveData.data.map((row) => ({
        ...row,
        BranchName:
          branch.find((b) => b.pn_BranchID === row.pn_BranchID)?.v_BranchName ||
          "N/A",
      }));

      setGridData(formattedData);
    }
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchLeaveData();
  };

  useEffect(() => {
    fetchAllData();
  }, [isloggedin, pnCompanyId]);

  useEffect(() => {
    let data = gridData;
    if (branchFilter)
      data = data.filter((row) => row.pn_BranchID == branchFilter);
    if (typeFilter) data = data.filter((row) => row.Type === typeFilter);
    setFilteredData(data);
  }, [gridData, branchFilter, typeFilter]);

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (
      lastRow &&
      (!lastRow.v_leaveName ||
        !lastRow.pn_leaveCode ||
        !lastRow.pn_Count ||
        !lastRow.status ||
        !lastRow.pn_BranchID ||
        !lastRow.max_days ||
        !lastRow.Type)
    ) {
      toast.dismiss();
      toast.warning(
        "Please fill all fields in the current row before adding a new one.",
        { position: "top-center", autoClose: 1000 }
      );
      return;
    }
    const newRow = {
      pnCompanyId,
      v_leaveName: "",
      pn_leaveCode: "",
      pn_Count: null,
      status: "Active",
      pn_BranchID: branch.length > 0 ? branch[0].pn_BranchID : null,
      max_days: null,
      Type: "",
      isNew: true,
    };
    setGridData((prev) => [...prev, newRow]);
  };

  const handleSaveAll = async () => {
    try {
      const newRows = gridData.filter((r) => r.isNew);
      if (!newRows.length) {
        toast.error("No new data to save");
        return;
      }

      for (const row of newRows) {
        if (
          !row.v_leaveName ||
          !row.pn_leaveCode ||
          !row.pn_Count ||
          !row.status ||
          !row.pn_BranchID ||
          !row.max_days ||
          !row.Type
        ) {
          toast.error("Please fill all fields for new rows before saving");
          return;
        }
      }

      const queries = newRows.map(
        (row) =>
          `INSERT INTO [${databaseName}].[dbo].[paym_Leave]
 (pn_CompanyID, v_leaveName, pn_leaveCode, pn_Count, status, pn_BranchID, max_days, Type)
 VALUES ('${row.pnCompanyId}', '${row.v_leaveName}', '${row.pn_leaveCode}', ${row.pn_Count}, '${row.status}', ${row.pn_BranchID}, ${row.max_days}, '${row.Type}')`

      );

      await Promise.all(
        queries.map((q) => postRequest(ServerConfig.url, SAVE, { query: q }))
      );
      toast.success("Data saved successfully");
      await fetchLeaveData();
    } catch (error) {
      toast.error("Failed to save data");
    }
  };

  const handleUpdateRow = async (rowData) => {
    try {
      const query = `UPDATE [${databaseName}].[dbo].[paym_Leave]
               SET v_leaveName='${rowData.v_leaveName}',
                   pn_leaveCode='${rowData.pn_leaveCode}',
                   pn_Count=${rowData.pn_Count},
                   status='${rowData.status}',
                   pn_BranchID=${rowData.pn_BranchID},
                   max_days=${rowData.max_days},
                   Type='${rowData.Type}'
               WHERE pn_leaveID='${rowData.pn_leaveID}'`;

      await postRequest(ServerConfig.url, SAVE, { query });
      toast.success("Data updated successfully");
      await fetchLeaveData();
    } catch (error) {
      toast.error("Failed to update data");
    }
  };

  const handleDeleteRow = async (rowData) => {
    if (!rowData.pn_leaveID) {
      setGridData((prev) => prev.filter((r) => r !== rowData));
      return;
    }
    const query = `DELETE FROM [${databaseName}].[dbo].[paym_Leave]
               WHERE pn_leaveID='${rowData.pn_leaveID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    toast.info("Data deleted successfully");
    await fetchLeaveData();
  };

  const columnDefs = [
    { headerName: "LEAVE CODE", field: "pn_leaveCode", editable: true },
    { headerName: "LEAVE NAME", field: "v_leaveName", editable: true },
    {
      headerName: "Branch",
      field: "pn_BranchID",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: branch.map((b) => b.BranchName) },
      valueGetter: (params) =>
        branch.find((b) => b.pn_BranchID === params.data.pn_BranchID)
          ?.BranchName || "",
      valueSetter: (params) => {
        const selected = branch.find((b) => b.BranchName === params.newValue);
        if (selected) {
          params.data.pn_BranchID = selected.pn_BranchID;
          return true;
        }
        return false;
      },
      minWidth: 150,
    },
    {
      headerName: "TYPE",
      field: "Type",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["Casual", "Sick", "Earned", "Other"] },
    },
    { headerName: "COUNT", field: "pn_Count", editable: true },
    {
      headerName: "Status",
      field: "status",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["Active", "Inactive", "Pending"] },
    },
    

    { headerName: "MAX DAYS", field: "max_days", editable: true },
    
    {
      headerName: "ACTION",
      cellRenderer: (params) => (
        <Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleUpdateRow(params.data)}
          >
            Edit
          </Button>

          <IconButton
            color="error"
            onClick={() => handleDeleteRow(params.data)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Grid container sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
      <Navbar />
      <Grid item xs={12} sx={{ display: "flex" }}>
        <Sidenav />
        <Grid item xs={12} sm={10} sx={{ p: 5, margin: "100px auto" }}>
          <AppBar
            position="static"
            sx={{
              mb: 3,
              borderRadius: 2,
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            }}
          >
            <Toolbar>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#fff" }}
              >
                Leave Master
              </Typography>
            </Toolbar>
          </AppBar>

          <Card
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#000" }}>Branch</InputLabel>
                  <Select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    sx={{ bgcolor: "#fff", color: "#000" }}
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {branch.map((b) => (
                      <MenuItem key={b.pn_BranchID} value={b.pn_BranchID}>
                        {b.BranchName || " "}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#000" }}>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{ bgcolor: "#fff", color: "#000" }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Casual">Casual</MenuItem>
                    <MenuItem value="Sick">Sick</MenuItem>
                    <MenuItem value="Earned">Earned</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
                <Button
                  onClick={handleAddRow}
                  sx={{ mr: 2, background: "#ff4b1f", color: "#fff" }}
                >
                  Add Leave
                </Button>
                <Button
                  onClick={handleSaveAll}
                  sx={{
                    background: "linear-gradient(45deg,#1fddff,#45f3ff)",
                    color: "#000",
                  }}
                >
                  Save All
                </Button>
              </Grid>
            </Grid>
          </Card>

          <Box
            className="ag-theme-alpine"
            sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 3, mb: 3 }}
          >
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              defaultColDef={{ flex: 1, minWidth: 120, resizable: true }}
              pagination
              paginationPageSize={10}
              animateRows
              getRowStyle={(params) => ({
                backgroundColor:
                  params.node.rowIndex % 2 === 0 ? "#e0f7fa" : "#ffffff",
              })}
            />
          </Box>

          <Dialog
            open={openView}
            onClose={() => setOpenView(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: "linear-gradient(135deg, #f6d365, #fda085)",
                p: 3,
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: "bold", color: "#333" }}>
              Leave Details
            </DialogTitle>
            <DialogContent>
              {viewData && (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Typography>
                    <strong>Branch:</strong>{" "}
                    {branch.find((b) => b.pn_BranchID === viewData.v_BranchName)
                      ?.v_BranchName || ""}
                  </Typography>
                  <Typography>
                    <strong>Leave Name:</strong> {viewData.v_leaveName}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong> {viewData.Type}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenView(false)}
                sx={{
                  background: "linear-gradient(45deg,#ff416c,#ff4b2b)",
                  color: "#fff",
                  fontWeight: "bold",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PaymLeaveMaster1;
