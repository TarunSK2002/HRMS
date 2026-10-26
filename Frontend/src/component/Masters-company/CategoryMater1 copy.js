import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Button,
  Typography,
  Box,
  IconButton,
  AppBar,
  Toolbar,
  MenuItem,
  Card,
  FormControl,
  Select,
  InputLabel,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import Navbar from "../Home Page-comapny/Navbar1";
import Sidenav from "../Home Page-comapny/Sidenav1";

const CategoryMasterUI = () => {
  const [company, setCompany] = useState([]);
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [modifiedRows, setModifiedRows] = useState({});
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [viewData, setViewData] = useState(null);
  const [openView, setOpenView] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ get DB name dynamically

  const getStatusLabel = (char) => {
    switch (char) {
      case "A":
        return "Active";
      case "I":
        return "Inactive";
      case "P":
        return "Pending";
      default:
        return "";
    }
  };

  const getStatusChar = (label) => {
    switch (label) {
      case "Active":
        return "A";
      case "Inactive":
        return "I";
      case "Pending":
        return "P";
      default:
        return "";
    }
  };

  const fetchCompanyData = async () => {
    const isloggedin = sessionStorage.getItem("user");
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company] WHERE company_user_id = '${isloggedin}'`,
    });
    setCompany(companyData.data);
    if (companyData.data.length > 0) {
      setPnCompanyId(companyData.data[0].pn_CompanyID);
      setCompanyName(companyData.data[0].CompanyName);
    }
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

  const fetchCategoryData = async () => {
    if (!pnCompanyId) return;
    const categoryData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT pn_CompanyID, BranchID, pn_CategoryID, v_CategoryName, status
        FROM [${databaseName}].[dbo].[paym_Category]
        WHERE pn_CompanyID='${pnCompanyId}'`,
    });
    const formattedData = categoryData.data.map((item) => ({
      pnCompanyId: item.pn_CompanyID,
      BranchID: item.BranchID,
      pn_CategoryID: item.pn_CategoryID,
      v_CategoryName: item.v_CategoryName,
      status: getStatusLabel(item.status),
    }));
    setGridData(formattedData || []);
    setOriginalData(JSON.parse(JSON.stringify(formattedData)) || []);
    setModifiedRows({});
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchCategoryData();
  };

  useEffect(() => {
    fetchAllData();
  }, [pnCompanyId]);

  const isRowModified = useCallback(
    (rowData) => {
      if (rowData.isNew) return false;
      const originalRow = originalData.find(
        (r) => r.pn_CategoryID === rowData.pn_CategoryID
      );
      if (!originalRow) return false;
      return (
        String(originalRow.BranchID) !== String(rowData.BranchID) ||
        String(originalRow.v_CategoryName) !== String(rowData.v_CategoryName) ||
        String(originalRow.status) !== String(rowData.status)
      );
    },
    [originalData]
  );

  const handleCellValueChanged = useCallback(
    (params) => {
      const rowData = params.data;
      if (!rowData.isNew) {
        const modified = isRowModified(rowData);
        setModifiedRows((prev) => ({
          ...prev,
          [rowData.pn_CategoryID]: modified,
        }));
      }
      params.api.refreshCells({ rowNodes: [params.node], force: true });
    },
    [isRowModified]
  );

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (
      lastRow &&
      (!lastRow.BranchID || !lastRow.v_CategoryName || !lastRow.status)
    ) {
      toast.warning(
        "Please fill all fields in the current row before adding a new one."
      );
      return;
    }
    setGridData((prev) => [
      ...prev,
      {
        pnCompanyId,
        BranchID: "",
        v_CategoryName: "",
        status: "",
        isNew: true,
      },
    ]);
  };

  const handleSaveAll = async () => {
    const newRows = gridData.filter((r) => r.isNew);
    if (newRows.some((r) => !r.BranchID || !r.v_CategoryName || !r.status)) {
      toast.error("Please fill all fields before saving");
      return;
    }
    const queries = newRows.map(
      (row) =>
        `INSERT INTO [${databaseName}].[dbo].[paym_Category]
 (pn_CompanyID, BranchID, v_CategoryName, status)
 VALUES ('${row.pnCompanyId}', '${row.BranchID}', '${row.v_CategoryName}', '${getStatusChar(row.status)}')`

    );
    await Promise.all(
      queries.map((q) => postRequest(ServerConfig.url, SAVE, { query: q }))
    );
    toast.success("Saved successfully");
    fetchAllData();
  };

  const handleUpdateRow = async (rowData) => {
    const query = `UPDATE [${databaseName}].[dbo].[paym_Category]
               SET BranchID='${rowData.BranchID}', 
                   v_CategoryName='${rowData.v_CategoryName}', 
                   status='${getStatusChar(rowData.status)}'
               WHERE pn_CategoryID='${rowData.pn_CategoryID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    setModifiedRows((prev) => {
      const copy = { ...prev };
      delete copy[rowData.pn_CategoryID];
      return copy;
    });
    toast.success("Updated successfully");
    fetchAllData();
  };

  const handleDeleteRow = async (rowData) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    const query = `DELETE FROM [${databaseName}].[dbo].[paym_Category]
               WHERE pn_CategoryID='${rowData.pn_CategoryID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    toast.info("Deleted successfully");
    fetchAllData();
  };

  const handleViewRow = (rowData) => {
    setViewData(rowData);
    setOpenView(true);
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Branch",
        field: "BranchID",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: branch.map((b) => b.BranchName) },
        valueGetter: (params) =>
          branch.find((b) => b.pn_BranchID === params.data.BranchID)
            ?.BranchName || "",
        valueSetter: (params) => {
          const selected = branch.find((b) => b.BranchName === params.newValue);
          if (selected) {
            params.data.BranchID = selected.pn_BranchID;
            return true;
          }
          return false;
        },
      },
      { headerName: "Category Name", field: "v_CategoryName", editable: true },
      {
        headerName: "Status",
        field: "status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["Active", "Inactive", "Pending"] },
      },
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              color="primary"
              onClick={() => handleViewRow(params.data)}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              color="success"
              onClick={() => handleUpdateRow(params.data)}
              disabled={!modifiedRows[params.data.pn_CategoryID]}
            >
              <DoneOutlineIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeleteRow(params.data)}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [branch, modifiedRows]
  );

  const filteredData = useMemo(
    () =>
      gridData.filter(
        (row) =>
          (!statusFilter || row.status === statusFilter) &&
          (!branchFilter || String(row.BranchID) === String(branchFilter))
      ),
    [gridData, statusFilter, branchFilter]
  );

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
                Category Master
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
                  <InputLabel sx={{ color: "#fff" }}>Branch</InputLabel>
                  <Select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    sx={{ bgcolor: "#fff", color: "#000" }}
                  >
                    <MenuItem value="">All Branches</MenuItem>
                    {branch.map((b) => (
                      <MenuItem key={b.pn_BranchID} value={b.pn_BranchID}>
                        {b.BranchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#fff" }}>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ bgcolor: "#fff", color: "#000" }}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
                <Button
                  onClick={handleAddRow}
                  sx={{ mr: 2, background: "#ff4b1f", color: "#fff" }}
                >
                  Add Category
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
              onCellValueChanged={handleCellValueChanged}
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
              Category Details
            </DialogTitle>
            <DialogContent>
              {viewData && (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Typography>
                    <strong>Branch:</strong>{" "}
                    {branch.find((b) => b.pn_BranchID === viewData.BranchID)
                      ?.BranchName || ""}
                  </Typography>
                  <Typography>
                    <strong>Category Name:</strong> {viewData.v_CategoryName}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {viewData.status}
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

export default CategoryMasterUI;
