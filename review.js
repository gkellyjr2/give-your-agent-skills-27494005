const DRAFT_KEY = "project-intake-draft";
const ACK_KEY = "project-intake-ack";

const reviewContainer = document.querySelector("#review-container");
const feedback = document.querySelector("#review-feedback");
const submitButton = document.querySelector("#final-submit");
const editButton = document.querySelector("#edit-responses");

const sectionConfig = [
  {
    title: "Requestor Information",
    fields: [
      ["Full Name", "requestorName"],
      ["Work Email", "requestorEmail"],
      ["Department", "department"],
      ["Role", "role"],
    ],
  },
  {
    title: "Project Overview",
    fields: [
      ["Project Title", "projectTitle"],
      ["Project Summary", "projectSummary"],
      ["Problem Statement", "problemStatement"],
      ["Desired Outcome", "desiredOutcome"],
      ["Request Type", "requestType"],
      ["Priority", "priority"],
    ],
  },
  {
    title: "Timeline and Scope",
    fields: [
      ["Desired Start Date", "startDate"],
      ["Desired Completion Date", "endDate"],
      ["Estimated Budget (USD)", "budget"],
      ["Primary Stakeholders", "stakeholders"],
      ["Dependencies", "dependencies"],
    ],
  },
  {
    title: "Success and Risk",
    fields: [
      ["Success Metrics", "successMetrics"],
      ["Key Risks or Constraints", "risks"],
      ["Data Sensitivity", "dataSensitivity"],
      ["Reference Link", "referenceLink"],
      ["Additional Notes", "notes"],
    ],
  },
];

function loadDraft() {
  const rawDraft = sessionStorage.getItem(DRAFT_KEY);
  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft);
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

function fieldValue(payload, key) {
  const value = payload[key];
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Not provided";
  }

  return String(value);
}

function buildSection(title, fields, payload) {
  const section = document.createElement("section");
  section.className = "review-section";

  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("dl");
  list.className = "review-grid";

  fields.forEach(([labelText, key]) => {
    const term = document.createElement("dt");
    term.textContent = labelText;

    const description = document.createElement("dd");
    description.textContent = fieldValue(payload, key);

    list.appendChild(term);
    list.appendChild(description);
  });

  section.appendChild(list);
  return section;
}

function renderDraft(payload) {
  reviewContainer.replaceChildren();

  sectionConfig.forEach((section) => {
    reviewContainer.appendChild(buildSection(section.title, section.fields, payload));
  });
}

async function persistSubmission(payload) {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || "Unable to save submission.";
    throw new Error(message);
  }

  return response.json();
}

const draft = loadDraft();

if (!draft) {
  reviewContainer.textContent = "No draft request found. Please return to the intake page and preview your submission again.";
  submitButton.disabled = true;
}

if (draft) {
  renderDraft(draft);
}

editButton.addEventListener("click", () => {
  window.location.href = "/index.html";
});

submitButton.addEventListener("click", async () => {
  if (!draft) {
    window.location.href = "/index.html";
    return;
  }

  submitButton.disabled = true;
  editButton.disabled = true;
  feedback.textContent = "Submitting request...";
  feedback.style.color = "#3a5869";

  try {
    const result = await persistSubmission(draft);
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.setItem(
      ACK_KEY,
      JSON.stringify({
        projectTitle: draft.projectTitle || "Untitled Project",
        fileName: result.fileName,
      })
    );
    window.location.href = "/acknowledge.html";
  } catch (error) {
    feedback.textContent = `Submission failed: ${error.message}`;
    feedback.style.color = "#aa3a1f";
    submitButton.disabled = false;
    editButton.disabled = false;
  }
});
