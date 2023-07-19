const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
mongoose
  .connect("mongodb://localhost:27017/newEmployeeDb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// Define employee schema
const employeeSchema = new mongoose.Schema({
  _id: { type: String, default: "1" },
  emp_first_name: {
    type: String,
    index: true,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  emp_last_name: {
    type: String,
    index: true,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  emp_dob: { type: String , required: true },
  emp_dept_id: { type: String },
  emp_salary: Number,
  emp_designation: { type: String, required: true },
  emp_status: Number,
});

// Define department schema
const departmentSchema = new mongoose.Schema({
  dept_id: {
    type: Number,
    default: 1,
  },
  dept_name: { type: String, required: true, minlength: 2, maxlength: 50 },
  dept_status: Number,
});

// Define employee document schema
const employeeDocumentSchema = new mongoose.Schema({
  document_id: { type: Number, required: true, default: 1 },
  doc_emp_id: { type: Number, required: true },
  doc_name: { type: String, required: true },
  doc_image: { type: String, required: true },
});

employeeSchema.index({ emp_first_name: "text" });
employeeSchema.index({ emp_dept_id: 1 });
employeeSchema.index({ emp_salary: 1 });
employeeSchema.index({ emp_designation: 1 });

const Employee = mongoose.model("Employee", employeeSchema);
const Department = mongoose.model("Department", departmentSchema);
const EmployeeDocument = mongoose.model(
  "EmployeeDocument",
  employeeDocumentSchema
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// REST API routes
// List all employees
app.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find({});
    const totalCount = employees.length;
    res.json({
      totalCount,
      responseCode: 1,
      responseMessage: "Employee List Retrived.",
      responseData: employees,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get an employee by ID
app.get("/employees/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const employee = await Employee.findById(employeeId).populate(
      "emp_dept_id"
    );
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const formattedEmployee = {
      ...employee._doc,
    };

    res.json({
      responseCode: 1,
      responseMessage: "Employee found.",
      responseData: formattedEmployee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add an employee
app.post("/employees", async (req, res) => {
  try {
    const {
      emp_first_name,
      emp_last_name,
      emp_dob,
      emp_dept_id,
      emp_salary,
      emp_designation,
      emp_status,
    } = req.body;

    if (!emp_first_name || !emp_last_name || !emp_dob || !emp_designation) {
      return res.status(400).json({ error: "Mandatory fields are missing" });
    }

    if (emp_first_name.length < 2 || emp_first_name.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_first_name" });
    }

    if (emp_last_name.length < 2 || emp_last_name.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_last_name" });
    }

    if (emp_designation.length < 2 || emp_designation.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_designation" });
    }

    const employeeCount = await Employee.countDocuments();
    const nextId = (employeeCount + 1).toString();
    const employee = new Employee({
      _id: nextId,
      emp_first_name,
      emp_last_name,
      emp_dob,
      emp_dept_id,
      emp_salary,
      emp_designation,
      emp_status: 1,
    });

    const savedEmployee = await employee.save();

    res.json({
      responseCode: 1,
      responseMessage: "Employee Created Successfully.",
      responseData: savedEmployee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit an employee
app.put("/employees/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;
    const {
      emp_first_name,
      emp_last_name,
      emp_dob,
      emp_dept_id,
      emp_salary,
      emp_designation,
      emp_status,
    } = req.body;

    if (!emp_first_name || !emp_last_name || !emp_dob || !emp_designation) {
      return res.status(400).json({ error: "Mandatory fields are missing" });
    }

    if (emp_first_name.length < 2 || emp_first_name.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_first_name" });
    }

    if (emp_last_name.length < 2 || emp_last_name.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_last_name" });
    }

    if (emp_designation.length < 2 || emp_designation.length > 50) {
      return res
        .status(400)
        .json({ error: "Invalid field length: emp_designation" });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      {
        emp_first_name,
        emp_last_name,
        emp_dob,
        emp_dept_id,
        emp_salary,
        emp_designation,
        emp_status,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({
      responseCode: 1,
      responseMessage: "Employee Update Successfully.",
      responseData: updatedEmployee,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an employee
app.delete("/employees/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const deletedEmployee = await Employee.findByIdAndRemove(employeeId);
    if (!deletedEmployee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    res.json({
      message: "Employee deleted successfully.",
      responseCode: 1,
      responseData: {},
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//documents API
app.get("/employees/:id/documents", async (req, res) => {
  try {
    const employeeId = req.params.id;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }
    const documents = await EmployeeDocument.find({ doc_emp_id: employeeId });
    const totalCount = documents.length;
    const documentList = documents.map((document) => ({
      document_id: document.document_id,
      doc_emp_id: document.doc_emp_id,
      doc_name: document.doc_name,
      doc_image: document.doc_image,
    }));

   
    res.json({
      totalCount,
      responseCode: 1,
      responseMessage: "Department List Retrived.",
      responseData: documentList,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/employees/:empId/documents/:docId", async (req, res) => {
  try {
    const empId = req.params.empId;
    const docId = req.params.docId;

    if (!empId || !docId) {
      return res.status(400).json({ error: "Employee ID and Document ID are required." });
    }

    const document = await EmployeeDocument.findOne({ doc_emp_id: empId, document_id: docId });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      responseCode: 1,
      responseMessage: "Document Retrieved Successfully.",
      responseData: document,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Upload employee documents
app.post(
  "/employees/:id/documents",
  upload.single("doc_image"),
  async (req, res) => {
    try {
      const employeeId = req.params.id.toString();
      const docName = req.body.doc_name;
      const docImage = req.file.filename;
      if (!employeeId || !docName || !docImage) {
        return res.status(400).json({
          error: "Employee ID, document name, and image are required.",
        });
      }

      const documentCount = await EmployeeDocument.countDocuments();
      const nextId = documentCount + 1;

      const newDocument = new EmployeeDocument({
        document_id: nextId,
        doc_emp_id: employeeId,
        doc_name: docName,
        doc_image: docImage,
      });

      const savedDocument = await newDocument.save();
      res.json({
        responseCode: 1,
        responseMessage: "Document Added Successfully.",
        responseData: savedDocument,
      });
    
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

//delete documents
app.delete("/employees/:employeeId/documents/:documentId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const documentId = req.params.documentId;

    if (!employeeId || !documentId) {
      return res.status(400).json({ error: "Employee ID and Document ID are required." });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const deletedDocument = await EmployeeDocument.findOneAndRemove({
      document_id: documentId,
      doc_emp_id: employeeId,
    });

    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update document
app.put("/employees/:empId/documents/:docId", upload.single("doc_image"), async (req, res) => {
  try {
    const employeeId = req.params.empId;
    const documentId = req.params.docId;
    const { doc_name } = req.body;
    const docImage = req.file ? req.file.filename : null;

    if (!employeeId || !documentId || !doc_name) {
      return res.status(400).json({ error: "Employee ID, document ID, and name are required." });
    }

    const updateFields = {
      doc_name: doc_name,
    };

    if (docImage) {
      updateFields.doc_image = docImage;
    }

    const updatedDocument = await EmployeeDocument.findOneAndUpdate(
      { doc_emp_id: employeeId, document_id: documentId },
     updateFields,
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      responseCode: 1,
      responseMessage: "Document updated successfully",
      responseData: updatedDocument,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add department
app.post("/departments", async (req, res) => {
  try {
    const { dept_name } = req.body;

    if (!dept_name) {
      return res.status(400).json({ error: "Department name is required." });
    }

    const highestDepartment = await Department.findOne()
      .sort("-dept_id")
      .exec();

    // Increment the highest department ID by 1 or start with 1 if there are no departments
    const dept_id = highestDepartment ? highestDepartment.dept_id + 1 : 1;

    const department = new Department({
      dept_id,
      dept_name,
      dept_status: 1, // Set the default status to active (1)
    });

    const savedDepartment = await department.save();

    res.json({
      responseCode: 1,
      responseMessage: "Deparemnt Addedd Successfully.",
      responseData: savedDepartment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//search api
app.post("/employees/search", async (req, res) => {
  try {
    const searchCriteria = {};

    if (req.body.emp_first_name) {
      searchCriteria.emp_first_name = {
        $regex: new RegExp(req.body.emp_first_name, "i"),
      };
    }

    if (req.body.emp_dept_id) {
      searchCriteria.emp_dept_id = req.body.emp_dept_id;
    }

    if (req.body.emp_salary) {
      searchCriteria.emp_salary = req.body.emp_salary;
    }

    if (req.body.emp_designation) {
      searchCriteria.emp_designation = {
        $regex: req.body.emp_designation,
        $options: "i",
      };
    }

    const employees = await Employee.find(searchCriteria)
      .sort({ emp_first_name: 1 })
      .hint({ emp_first_name: 1 });

    if (employees.length === 0) {
      return res.status(404).json({ error: "No employees found" });
    }

    const employeeList = employees.map((employee) => {
      const { _id, ...rest } = employee.toObject();
      return rest;
    });

    res.json({
      responseCode: 1,
      responseMessage: "employee search.",
      responseData: employeeList,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
