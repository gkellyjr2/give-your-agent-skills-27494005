const DRAFT_KEY = "project-intake-draft";
const ACK_KEY = "project-intake-ack";

const ackMessage = document.querySelector("#ack-message");
const ackFeedback = document.querySelector("#ack-feedback");
const newRequestButton = document.querySelector("#new-request");
const closeButton = document.querySelector("#close-app");

function loadAckData() {
  const raw = sessionStorage.getItem(ACK_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(ACK_KEY);
    return null;
  }
}

const ackData = loadAckData();
const projectTitle = ackData?.projectTitle || "your project";
const fileName = ackData?.fileName || "the generated submission file";

ackMessage.textContent = `Your request for \"${projectTitle}\" has been submitted successfully and saved as ${fileName}.`;

newRequestButton.addEventListener("click", () => {
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(ACK_KEY);
  window.location.href = "/index.html";
});

closeButton.addEventListener("click", () => {
  window.close();

  ackFeedback.textContent =
    "If this tab did not close automatically, you can close it from your browser now.";
  ackFeedback.style.color = "#3a5869";
});
