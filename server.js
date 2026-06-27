const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const HOST = "0.0.0.0";
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const SUBMISSION_DIR = path.join(ROOT_DIR, "project_submissions");

function ensureSubmissionDirectory() {
  fs.mkdirSync(SUBMISSION_DIR, { recursive: true });
}

function slugify(value) {
  return String(value || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "untitled";
}

function compactTimestamp(date = new Date()) {
  const iso = date.toISOString();
  return iso.replace(/[-:]/g, "").replace(".", "").replace("Z", "");
}

function submissionFilename(payload, requestId) {
  const timestamp = compactTimestamp();
  const titleSlug = slugify(payload.projectTitle);
  return `project-intake_${timestamp}_${titleSlug}_${requestId.slice(0, 8)}.json`;
}

function jsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body, null, 2));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(500);
      res.end("Server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".ico": "image/x-icon",
      ".json": "application/json; charset=utf-8",
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
    res.end(content);
  });
}

function validateRequiredFields(submission) {
  const required = [
    "requestorName",
    "requestorEmail",
    "department",
    "projectTitle",
    "projectSummary",
    "problemStatement",
    "desiredOutcome",
    "requestType",
    "priority",
    "startDate",
    "endDate",
    "successMetrics",
    "dataSensitivity",
  ];

  const missing = required.filter((field) => !submission[field]);
  return missing;
}

function normalizeSubmissionBody(body) {
  const normalized = {};

  for (const [key, value] of Object.entries(body)) {
    normalized[key] = typeof value === "string" ? value.trim() : value;
  }

  return normalized;
}

function buildSubmissionRecord(submission) {
  const requestId = randomUUID();
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0.0",
    requestId,
    submittedAt: now,
    source: {
      channel: "project-intake-web",
      application: "give-your-agent-skills-27494005",
    },
    requestor: {
      name: submission.requestorName || "",
      email: submission.requestorEmail || "",
      department: submission.department || "",
      role: submission.role || "",
    },
    project: {
      title: submission.projectTitle || "",
      summary: submission.projectSummary || "",
      problemStatement: submission.problemStatement || "",
      desiredOutcome: submission.desiredOutcome || "",
      type: submission.requestType || "",
      priority: submission.priority || "",
      timeline: {
        desiredStartDate: submission.startDate || "",
        desiredEndDate: submission.endDate || "",
      },
      budget: {
        estimateUsd: submission.budget || "",
      },
      stakeholders: submission.stakeholders || "",
      dependencies: submission.dependencies || "",
      successMetrics: submission.successMetrics || "",
      risks: submission.risks || "",
      dataSensitivity: submission.dataSensitivity || "",
      referenceLink: submission.referenceLink || "",
      notes: submission.notes || "",
    },
  };
}

function handleSubmission(req, res) {
  let rawBody = "";

  req.on("data", (chunk) => {
    rawBody += chunk;

    if (rawBody.length > 1_000_000) {
      req.destroy();
    }
  });

  req.on("end", () => {
    let parsedBody;

    try {
      parsedBody = JSON.parse(rawBody || "{}");
    } catch {
      jsonResponse(res, 400, { error: "Invalid JSON body." });
      return;
    }

    const normalized = normalizeSubmissionBody(parsedBody);
    const missingFields = validateRequiredFields(normalized);

    if (missingFields.length > 0) {
      jsonResponse(res, 400, {
        error: "Missing required fields.",
        missingFields,
      });
      return;
    }

    const startDate = new Date(normalized.startDate);
    const endDate = new Date(normalized.endDate);

    if (endDate < startDate) {
      jsonResponse(res, 400, {
        error: "Completion date must be on or after the start date.",
      });
      return;
    }

    const record = buildSubmissionRecord(normalized);
    const fileName = submissionFilename(normalized, record.requestId);
    const filePath = path.join(SUBMISSION_DIR, fileName);

    fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8", (error) => {
      if (error) {
        jsonResponse(res, 500, {
          error: "Unable to persist submission file.",
        });
        return;
      }

      jsonResponse(res, 201, {
        message: "Submission stored.",
        fileName,
        storagePath: path.relative(ROOT_DIR, filePath),
        submission: record,
      });
    });
  });
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestPath).replace(/^\.+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  sendFile(res, filePath);
}

ensureSubmissionDirectory();

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }

  if (req.url === "/api/submissions" && req.method === "POST") {
    handleSubmission(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  jsonResponse(res, 405, {
    error: "Method not allowed.",
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Project intake app running at http://localhost:${PORT}`);
  console.log(`Submissions persist in ${path.relative(ROOT_DIR, SUBMISSION_DIR)}`);
});
