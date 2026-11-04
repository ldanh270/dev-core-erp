/**
 * DevCore ERP - Database Schema Metadata Generator
 * Reads backend/prisma/schema.prisma and generates structured metadata for the frontend Data Dictionary & ERD Viewer.
 */
const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PRISMA_PATH = path.join(ROOT_DIR, "backend/prisma/schema.prisma");
const DATA_DIR = path.join(ROOT_DIR, "frontend/src/data");
const SUMMARY_PATH = path.join(DATA_DIR, "schema-summary.json");
const TABLES_DIR = path.join(DATA_DIR, "tables");

fs.mkdirSync(TABLES_DIR, { recursive: true });

// 1. Module Definition & Color Palette
const MODULE_CONFIG = {
  HRM: {
    name: "Nhân sự & Tổ chức (HRM)",
    color: "#0284c7", // Sky blue
    icon: "Users",
    description: "Quản lý nhân viên, hợp đồng lao động, bảo hiểm, phòng ban, chức vụ và chi nhánh",
  },
  ATTENDANCE: {
    name: "Chấm công & Ca làm (Attendance)",
    color: "#16a34a", // Emerald green
    icon: "Clock",
    description: "Lịch làm việc hàng tuần, phân ca, chấm công thực tế, đơn từ (nghỉ phép, đổi ca, OT)",
  },
  PAYROLL: {
    name: "Tiền lương & Đãi ngộ (Payroll)",
    color: "#d97706", // Amber
    icon: "BadgeDollarSign",
    description: "Bảng lương theo chu kỳ, công thức tính lương MathJS, phiếu lương và cấu phần lương",
  },
  PROJECT: {
    name: "Dự án & Nhiệm vụ (Project)",
    color: "#7c3aed", // Violet
    icon: "FolderKanban",
    description: "Quản lý dự án, task, thành viên dự án, tracker, chấm thời gian spent-time và capacity board",
  },
  RECRUITMENT: {
    name: "Tuyển dụng (Recruitment)",
    color: "#ea580c", // Orange
    icon: "UserPlus",
    description: "Đề xuất tuyển dụng (Requisition), tin tuyển dụng, hồ sơ ứng viên và lịch phỏng vấn",
  },
  SECURITY: {
    name: "Bảo mật & Phân quyền (RBAC)",
    color: "#dc2626", // Red
    icon: "ShieldCheck",
    description: "Tài khoản người dùng, vai trò (Role), quyền hạn (Permission), phiên đăng nhập và bảo mật",
  },
  SYSTEM: {
    name: "Hệ thống & Quy trình (System)",
    color: "#4b5563", // Gray
    icon: "Sliders",
    description: "Nhật ký hệ thống (Audit log), quy trình phê duyệt đa cấp, thông báo và cấu hình",
  },
};

// Model classification mapping
function detectModule(modelName) {
  const m = modelName.toLowerCase();

  // Recruitment
  if (
    m.includes("recruitment") ||
    m.includes("candidate") ||
    m.includes("requisition") ||
    m.includes("job") ||
    m.includes("interview") ||
    m.includes("applicant") ||
    m.includes("oauth") ||
    m.includes("posting") ||
    m.includes("scorecard") ||
    m.includes("offer") ||
    m.includes("backgroundcheck")
  ) {
    return "RECRUITMENT";
  }

  // Security & RBAC
  if (
    m.includes("user") ||
    m.includes("role") ||
    m.includes("permission") ||
    m.includes("token") ||
    m.includes("session") ||
    m.includes("auth") ||
    m.includes("credential") ||
    m.includes("passwordreset") ||
    m.includes("adminstatelock")
  ) {
    return "SECURITY";
  }

  // Attendance & Schedule
  if (
    m.includes("shift") ||
    m.includes("attendance") ||
    m.includes("schedule") ||
    m.includes("holiday") ||
    m.includes("leave") ||
    m.includes("application") ||
    m.includes("availability")
  ) {
    return "ATTENDANCE";
  }

  // Payroll
  if (
    m.includes("payroll") ||
    m.includes("salary") ||
    m.includes("payslip") ||
    m.includes("wage") ||
    m.includes("tax") ||
    m.includes("allowance") ||
    m.includes("deduction")
  ) {
    return "PAYROLL";
  }

  // Project & Task
  if (
    m.includes("project") ||
    m.includes("task") ||
    m.includes("spenttime") ||
    m.includes("tracker") ||
    m.includes("capacity") ||
    m.includes("milestone") ||
    m.includes("issue")
  ) {
    return "PROJECT";
  }

  // HRM
  if (
    m.includes("employee") ||
    m.includes("contract") ||
    m.includes("insurance") ||
    m.includes("department") ||
    m.includes("position") ||
    m.includes("branch") ||
    m.includes("profile") ||
    m.includes("document") ||
    m.includes("skill") ||
    m.includes("education") ||
    m.includes("regime")
  ) {
    return "HRM";
  }

  // Default to System
  return "SYSTEM";
}

// 2. Common Table & Field Vietnamese Dictionary
const TABLE_DESCRIPTIONS = {
  Employee: "Hồ sơ nhân viên trung tâm, lưu thông tin định danh, chức danh, phân loại và trạng thái công tác",
  EmployeeContract: "Hợp đồng lao động của nhân viên (loại hợp đồng, mức lương, phụ cấp, ngày ký và thời hạn)",
  EmployeeInsurance: "Thông tin bảo hiểm xã hội (BHXH), bảo hiểm y tế (BHYT), bảo hiểm thất nghiệp (BHTN)",
  Department: "Cơ cấu phòng ban / bộ phận trong doanh nghiệp",
  Position: "Vị trí chuyên môn / chức danh công việc của nhân sự",
  Branch: "Chi nhánh và địa điểm làm việc của công ty",
  WorkingShift: "Khung ca làm việc tiêu chuẩn (giờ bắt đầu, giờ kết thúc, thời gian nghỉ giữa ca)",
  ShiftSchedule: "Lịch phân ca tuần hoặc tháng cho các nhóm nhân viên",
  ShiftScheduleDay: "Chi tiết ca làm việc cụ thể theo từng ngày trong lịch phân ca",
  EmployeeShift: "Phân ca làm việc chi tiết đến từng nhân viên theo ngày",
  RealShift: "Ca làm việc thực tế được ghi nhận sau khi nhân viên check-in/check-out",
  AttendanceRecord: "Bản ghi chấm công thực tế theo ca hoặc theo ngày (giờ vào, giờ ra, số phút trễ/sớm/OT)",
  WeeklyScheduleTemplate: "Mẫu lịch làm việc lặp lại hàng tuần",
  WeeklyScheduleTemplateWeek: "Cấu hình tuần trong mẫu lịch làm việc",
  WeeklyScheduleTemplateDay: "Cấu hình ca làm cho từng ngày thứ trong tuần của mẫu lịch",
  PartTimeAvailability: "Khung thời gian rảnh đăng ký làm việc hàng tuần của nhân viên Part-time",
  Holiday: "Danh mục ngày nghỉ lễ / Tết của quốc gia hoặc sự kiện nội bộ công ty",
  Application: "Đơn từ hành chính của nhân viên (xin nghỉ phép, đổi ca làm, đăng ký làm thêm giờ OT)",
  ApplicationLeaveDetail: "Chi tiết ngày nghỉ và lý do của đơn xin nghỉ phép",
  ApplicationShiftSwapDetail: "Chi tiết yêu cầu đổi ca làm việc giữa các nhân viên",
  ApplicationOvertimeDetail: "Chi tiết số giờ và công việc của đơn đăng ký làm thêm giờ (OT)",
  Payroll: "Bảng tính lương tổng hợp theo kỳ/tháng cho toàn bộ công ty",
  PayrollItem: "Dòng chi tiết tính lương của từng nhân viên trong kỳ lương",
  PayrollFormula: "Công thức toán học tính lương (MathJS) linh hoạt theo chính sách công ty",
  PayslipTemplate: "Mẫu giao diện và cấu trúc hiển thị phiếu lương gửi cho nhân viên",
  SalaryComponent: "Các cấu phần thu nhập và khấu trừ trong lương (lương cơ bản, phụ cấp, thưởng, phạt)",
  Project: "Dự án phát triển phần mềm / hợp đồng dịch vụ IT outsourcing",
  ProjectMember: "Thành viên tham gia dự án và vai trò đảm nhiệm",
  ProjectRole: "Vai trò chức năng của thành viên trong dự án (PM, Tech Lead, Dev, QA, UI/UX...)",
  Task: "Nhiệm vụ / công việc chi tiết trong dự án kèm tiến độ và deadline",
  TaskComment: "Bình luận, trao đổi ý kiến trong nhiệm vụ",
  TaskAttachment: "Tệp tin tài liệu đính kèm trong nhiệm vụ",
  ProjectTaskStatus: "Trạng thái tiến độ công việc của dự án (To Do, In Progress, Review, Done...)",
  ProjectTracker: "Phân loại đầu việc dự án (Bug, Feature, Task, Improvement...)",
  SpentTime: "Bản ghi chấm giờ làm việc thực tế (log work) vào từng task của dự án",
  User: "Tài khoản xác thực đăng nhập hệ thống DevCore ERP",
  Role: "Vai trò bảo mật trong ma trận phân quyền RBAC",
  Permission: "Quyền hạn chi tiết cho từng tài nguyên và hành động",
  RolePermission: "Bảng liên kết phân bổ quyền hạn cho từng vai trò",
  UserRole: "Bảng phân bổ vai trò cho tài khoản người dùng",
  AuditLog: "Nhật ký kiểm toán ghi lại mọi thay đổi dữ liệu quan trọng",
  JobPosting: "Tin tuyển dụng nhân sự đăng tải ra ngoài hoặc nội bộ",
  Candidate: "Hồ sơ ứng viên nộp đơn ứng tuyển",
  Interview: "Lịch phỏng vấn ứng viên kèm hội đồng phỏng vấn",
};

const COMMON_FIELD_DICTIONARY = {
  id: "Khóa chính bản ghi (Primary Key)",
  createdat: "Thời điểm tạo bản ghi",
  createdby: "Người tạo bản ghi",
  updatedat: "Thời điểm cập nhật bản ghi gần nhất",
  updatedby: "Người cập nhật bản ghi gần nhất",
  deletedat: "Thời điểm xóa mềm (soft delete)",
  delflag: "Cờ đánh dấu xóa logic",
  status: "Trạng thái nghiệp vụ hiện tại",
  name: "Tên định danh hiển thị",
  code: "Mã quy chuẩn / Mã định danh duy nhất",
  title: "Tiêu đề / Chức danh",
  description: "Mô tả chi tiết nghiệp vụ",
  note: "Ghi chú nội bộ bổ sung",
  email: "Địa chỉ email liên hệ",
  phone: "Số điện thoại liên lạc",
  address: "Địa chỉ liên hệ",
  avatar: "Đường dẫn ảnh đại diện",
  startdate: "Ngày bắt đầu có hiệu lực",
  enddate: "Ngày kết thúc hiệu lực",
  starttime: "Thời gian bắt đầu ca/sự kiện",
  endtime: "Thời gian kết thúc ca/sự kiện",
  salary: "Mức lương cơ bản / Số tiền lương",
  currency: "Đơn vị tiền tệ (mặc định VND)",
  amount: "Số tiền / Giá trị tính toán",
  employeeid: "Mã liên kết hồ sơ nhân viên",
  userid: "Mã liên kết tài khoản người dùng",
  projectid: "Mã liên kết dự án",
  taskid: "Mã liên kết nhiệm vụ / công việc",
  departmentid: "Mã liên kết phòng ban",
  positionid: "Mã liên kết vị trí chuyên môn",
  branchid: "Mã liên kết chi nhánh làm việc",
  roleid: "Mã liên kết vai trò phân quyền",
  permissionid: "Mã liên kết quyền hạn",
  payrollid: "Mã liên kết bảng lương chu kỳ",
  shiftid: "Mã liên kết ca làm việc",
  contractnumber: "Mã số hợp đồng lao động duy nhất",
  contracttype: "Phân loại hợp đồng lao động",
  isactive: "Trạng thái kích hoạt sử dụng",
  isapproved: "Đã được phê duyệt",
  isclosed: "Đã đóng / hoàn thành",
  priority: "Mức độ ưu tiên xử lý",
  color: "Mã màu nhận diện giao diện",
  order: "Thứ tự sắp xếp hiển thị",
  version: "Phiên bản dữ liệu (hỗ trợ versioning)",
};

function getFieldDescription(fieldName, modelName) {
  const lower = fieldName.toLowerCase();
  if (COMMON_FIELD_DICTIONARY[lower]) {
    return COMMON_FIELD_DICTIONARY[lower];
  }
  // Context-aware guesses
  if (lower.endsWith("id")) {
    const target = fieldName.slice(0, -2);
    return `Mã liên kết đến bảng ${target}`;
  }
  if (lower.startsWith("is") || lower.startsWith("has")) {
    return `Cờ đánh dấu logic (${fieldName})`;
  }
  if (lower.includes("date") || lower.includes("at")) {
    return `Thời gian / Ngày tháng ghi nhận`;
  }
  if (lower.includes("count") || lower.includes("num") || lower.includes("total")) {
    return `Chỉ số số lượng / Tổng số`;
  }
  return `Trường dữ liệu ${fieldName}`;
}

function parseIndexColumns(rawList) {
  return rawList
    .split(",")
    .map((item) => item.replace(/\(.*\)/, "").trim())
    .filter(Boolean);
}

// 3. Parser Implementation
function parsePrismaSchema(content) {
  // Parse Enums
  const enums = {};
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let eMatch;
  while ((eMatch = enumRegex.exec(content)) !== null) {
    const name = eMatch[1];
    const rawBody = eMatch[2];
    const values = rawBody
      .split("\n")
      .map((l) => l.replace(/\/\/.*$/, "").trim())
      .filter((l) => l.length > 0 && !l.startsWith("//"));
    
    enums[name] = {
      name,
      values,
      description: `Kiểu danh mục liệt kê ${name} (${values.length} giá trị)`,
    };
  }

  // Parse Models
  const models = {};
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?\n)\}/g;
  let mMatch;

  while ((mMatch = modelRegex.exec(content)) !== null) {
    const modelName = mMatch[1];
    const body = mMatch[2];
    const moduleKey = detectModule(modelName);

    // Check @@map("table_name")
    let dbName = modelName;
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    if (mapMatch) {
      dbName = mapMatch[1];
    }

    const columns = [];
    const relationFields = []; // virtual relation fields in Prisma
    const modelUniqueIndexes = [];
    const modelStandardIndexes = [];
    let compositePkCols = [];

    const lines = body.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//")) continue;
      if (line.startsWith("@@")) {
        const idMatch = line.match(/^@@id\(\[([^\]]+)\]/);
        if (idMatch) {
          compositePkCols = parseIndexColumns(idMatch[1]);
        }
        const uniqMatch = line.match(/^@@unique\(\[([^\]]+)\]/);
        if (uniqMatch) {
          const cols = parseIndexColumns(uniqMatch[1]);
          if (cols.length > 0) modelUniqueIndexes.push(cols);
        }
        const idxMatch = line.match(/^@@index\(\[([^\]]+)\]/);
        if (idxMatch) {
          const cols = parseIndexColumns(idxMatch[1]);
          if (cols.length > 0) modelStandardIndexes.push(cols);
        }
        continue;
      }

      // Extract: name type ? [] attrs
      const fieldMatch = line.match(/^(\w+)\s+([A-Za-z0-9_]+)(\[\]|\?)?(.*)$/);
      if (!fieldMatch) continue;

      const [, fName, fType, fModifier, fRest] = fieldMatch;
      const isArray = fModifier === "[]";
      const isOptional = fModifier === "?";
      const isPk = fRest.includes("@id");
      const isUnique = fRest.includes("@unique");

      // Extract default value
      let defaultValue = null;
      const defMatch = fRest.match(/@default\(([^)]+)\)/);
      if (defMatch) {
        defaultValue = defMatch[1].replace(/"/g, "").trim();
      }

      // Check if it's a Prisma relation definition
      if (fRest.includes("@relation")) {
        const relMatch = fRest.match(/@relation\(([^)]+)\)/);
        if (relMatch) {
          const relContent = relMatch[1];
          const fieldsMatch = relContent.match(/fields:\s*\[([^\]]+)\]/);
          const refMatch = relContent.match(/references:\s*\[([^\]]+)\]/);
          const nameMatch = relContent.match(/"([^"]+)"/);

          relationFields.push({
            virtualName: fName,
            targetModel: fType,
            relationName: nameMatch ? nameMatch[1] : null,
            foreignKeyFields: fieldsMatch ? fieldsMatch[1].split(",").map((s) => s.trim()) : [],
            referenceFields: refMatch ? refMatch[1].split(",").map((s) => s.trim()) : [],
          });
        }
      }

      // If fType is another Model or Model[], it is a Prisma relation field, not a real DB column
      const isPrismaRelationField = !isPk && (fRest.includes("@relation") || isArray);

      columns.push({
        name: fName,
        type: fType,
        isArray,
        isOptional,
        isPk,
        isUnique,
        defaultValue,
        isFk: false,
        fkTargetTable: null,
        fkTargetField: null,
        isEnum: !!enums[fType],
        isPrismaVirtual: isPrismaRelationField,
        description: getFieldDescription(fName, modelName),
        rawAttributes: fRest.trim(),
      });
    }

    // Mark composite @@id columns as primary keys
    if (compositePkCols.length > 0) {
      for (const pkColName of compositePkCols) {
        const col = columns.find((c) => c.name === pkColName);
        if (col) col.isPk = true;
      }
    }

    // Now enrich real DB columns with FK information from relation definitions
    for (const rel of relationFields) {
      if (rel.foreignKeyFields && rel.foreignKeyFields.length > 0) {
        for (let i = 0; i < rel.foreignKeyFields.length; i++) {
          const fkName = rel.foreignKeyFields[i];
          const targetRef = rel.referenceFields[i] || "id";
          const col = columns.find((c) => c.name === fkName);
          if (col) {
            col.isFk = true;
            col.fkTargetTable = rel.targetModel;
            col.fkTargetField = targetRef;
            col.relationName = rel.relationName;
          }
        }
      }
    }

    // Filter out virtual relation fields so DB columns table shows real physical columns
    const dbColumns = columns.filter((c) => !c.isPrismaVirtual);

    // Build table indexes (Primary, Unique, Standard) matching reference schema format
    const indexMap = new Map();
    const addIndex = (name, idxColumns, isUnique, isPrimary) => {
      const existing = indexMap.get(name);
      if (existing) {
        existing.isPrimary = existing.isPrimary || isPrimary;
        existing.isUnique = existing.isUnique || isUnique;
        return;
      }
      indexMap.set(name, {
        name,
        columns: idxColumns,
        isUnique,
        isPrimary,
      });
    };

    for (const col of dbColumns) {
      if (col.isUnique) {
        addIndex(`IX_${dbName}_${col.name}`, [col.name], true, false);
      }
    }
    for (const cols of modelUniqueIndexes) {
      addIndex(`IX_${dbName}_${cols.join("_")}`, cols, true, false);
    }
    for (const cols of modelStandardIndexes) {
      addIndex(`IX_${dbName}_${cols.join("_")}`, cols, false, false);
    }
    const pkColumns =
      compositePkCols.length > 0
        ? compositePkCols
        : dbColumns.filter((c) => c.isPk).map((c) => c.name);
    if (pkColumns.length > 0) {
      addIndex(`PK_${dbName}`, pkColumns, true, true);
    }

    const indexes = Array.from(indexMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    models[modelName] = {
      name: modelName,
      dbName,
      module: moduleKey,
      description: TABLE_DESCRIPTIONS[modelName] || `Bảng dữ liệu ${modelName} trong hệ thống ERP`,
      columns: dbColumns,
      indexes,
      virtualRelations: relationFields,
      outgoingRelations: [],
      incomingRelations: [],
    };
  }

  // 4. Compute Foreign Key Graph (Outgoing & Incoming Relations)
  for (const modelName in models) {
    const model = models[modelName];

    for (const col of model.columns) {
      if (col.isFk && col.fkTargetTable && models[col.fkTargetTable]) {
        const targetModel = models[col.fkTargetTable];

        // Outgoing
        model.outgoingRelations.push({
          sourceColumn: col.name,
          targetTable: col.fkTargetTable,
          targetColumn: col.fkTargetField || "id",
          relationName: col.relationName,
        });

        // Incoming on target
        targetModel.incomingRelations.push({
          sourceTable: modelName,
          sourceColumn: col.name,
          targetColumn: col.fkTargetField || "id",
          relationName: col.relationName,
        });
      }
    }
  }

  // Summary Metrics
  const tableList = Object.values(models);
  const totalTables = tableList.length;
  const totalEnums = Object.keys(enums).length;
  let totalColumns = 0;
  let totalRelations = 0;

  tableList.forEach((t) => {
    totalColumns += t.columns.length;
    totalRelations += t.outgoingRelations.length;
  });

  const moduleStats = Object.keys(MODULE_CONFIG).map((key) => {
    const config = MODULE_CONFIG[key];
    const tablesInModule = tableList.filter((t) => t.module === key);
    return {
      id: key,
      name: config.name,
      color: config.color,
      icon: config.icon,
      description: config.description,
      tableCount: tablesInModule.length,
      tables: tablesInModule.map((t) => t.name),
    };
  });

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      schemaEngine: "Prisma PostgreSQL",
      sourceFile: "backend/prisma/schema.prisma",
      totalTables,
      totalEnums,
      totalColumns,
      totalRelations,
      version: "1.0.0",
    },
    modules: moduleStats,
    tables: models,
    enums,
  };
}

// 5. Run Execution
try {
  console.log("Reading Prisma Schema from:", PRISMA_PATH);
  const content = fs.readFileSync(PRISMA_PATH, "utf8");
  const schemaData = parsePrismaSchema(content);
  const { tables, ...summaryData } = schemaData;
  const tableList = Object.values(tables);
  const summary = {
    ...summaryData,
    tables: tableList.map((table) => ({
      name: table.name,
      dbName: table.dbName,
      module: table.module,
      description: table.description,
      columnCount: table.columns.length,
      indexCount: table.indexes.length,
      outgoingRelationCount: table.outgoingRelations.length,
      incomingRelationCount: table.incomingRelations.length,
    })),
  };
  const currentTableFiles = new Set(tableList.map((table) => `${table.name}.json`));

  for (const fileName of fs.readdirSync(TABLES_DIR)) {
    if (fileName.endsWith(".json") && !currentTableFiles.has(fileName)) {
      fs.unlinkSync(path.join(TABLES_DIR, fileName));
    }
  }

  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
  for (const table of tableList) {
    fs.writeFileSync(
      path.join(TABLES_DIR, `${table.name}.json`),
      JSON.stringify(table, null, 2),
      "utf8",
    );
  }

  console.log("SUCCESS! Generated database schema metadata at:");
  console.log("->", SUMMARY_PATH);
  console.log("->", TABLES_DIR);
  console.log(`- Total Tables: ${schemaData.metadata.totalTables}`);
  console.log(`- Total Columns: ${schemaData.metadata.totalColumns}`);
  console.log(`- Total Relations: ${schemaData.metadata.totalRelations}`);
  console.log(`- Total Enums: ${schemaData.metadata.totalEnums}`);
} catch (err) {
  console.error("Error generating database schema:", err);
  process.exit(1);
}
