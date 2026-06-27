const form = document.querySelector("#project-intake-form");
const feedback = document.querySelector("#form-feedback");
const DRAFT_KEY = "project-intake-draft";

function clearInvalidStates() {
  const controls = form.querySelectorAll("input, select, textarea");
  controls.forEach((control) => {
    control.removeAttribute("aria-invalid");
  });
}

function markInvalidControls() {
  const invalidControls = Array.from(form.elements).filter(
    (element) =>
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
  ).filter((element) => !element.checkValidity());

  invalidControls.forEach((control) => {
    control.setAttribute("aria-invalid", "true");
  });

  return invalidControls;
}

function collectFormData() {
  const data = new FormData(form);
  const payload = {};

  for (const [key, value] of data.entries()) {
    payload[key] = String(value).trim();
  }

  return payload;
}

function validateDateOrder(startDate, endDate) {
  if (!startDate || !endDate) {
    return true;
  }

  return new Date(endDate) >= new Date(startDate);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearInvalidStates();

  const invalidControls = markInvalidControls();
  if (invalidControls.length > 0) {
    feedback.textContent = "Please complete the required fields before submitting.";
    feedback.style.color = "#aa3a1f";
    invalidControls[0].focus();
    return;
  }

  const payload = collectFormData();

  if (!validateDateOrder(payload.startDate, payload.endDate)) {
    feedback.textContent = "Completion date must be on or after the start date.";
    feedback.style.color = "#aa3a1f";
    form.elements.endDate.setAttribute("aria-invalid", "true");
    form.elements.endDate.focus();
    return;
  }

  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  feedback.textContent = "Validation passed. Redirecting to review...";
  feedback.style.color = "#0f766e";
  window.location.href = "/review.html";
});

form.addEventListener("reset", () => {
  clearInvalidStates();
  feedback.textContent = "";
  sessionStorage.removeItem(DRAFT_KEY);
});

function restoreDraftToForm() {
  const rawDraft = sessionStorage.getItem(DRAFT_KEY);
  if (!rawDraft) {
    return;
  }

  let draft;
  try {
    draft = JSON.parse(rawDraft);
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return;
  }

  Object.entries(draft).forEach(([fieldName, fieldValue]) => {
    const field = form.elements.namedItem(fieldName);
    if (field && "value" in field) {
      field.value = String(fieldValue);
    }
  });
}

restoreDraftToForm();
