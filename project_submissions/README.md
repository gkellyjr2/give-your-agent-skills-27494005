# Project Submissions

This directory stores persisted project intake submissions as JSON files.

## Filename Convention

Each submission filename follows this format:

`project-intake_YYYYMMDDTHHMMSSmmm_project-title-slug_requestid8.json`

Example:

`project-intake_20260627T141530123_customer-portal-redesign_a1b2c3d4.json`

### Meaning

- `YYYYMMDDTHHMMSSmmm`: UTC timestamp when the request was submitted.
- `project-title-slug`: Lowercase slug based on project title (letters/digits/hyphens).
- `requestid8`: First 8 chars of a UUID to ensure uniqueness.

## Universal JSON Structure

Each file uses a stable schema envelope:

```json
{
  "schemaVersion": "1.0.0",
  "requestId": "uuid",
  "submittedAt": "ISO-8601 timestamp",
  "source": {
    "channel": "project-intake-web",
    "application": "repository-name"
  },
  "requestor": {
    "name": "",
    "email": "",
    "department": "",
    "role": ""
  },
  "project": {
    "title": "",
    "summary": "",
    "problemStatement": "",
    "desiredOutcome": "",
    "type": "",
    "priority": "",
    "timeline": {
      "desiredStartDate": "YYYY-MM-DD",
      "desiredEndDate": "YYYY-MM-DD"
    },
    "budget": {
      "estimateUsd": ""
    },
    "stakeholders": "",
    "dependencies": "",
    "successMetrics": "",
    "risks": "",
    "dataSensitivity": "",
    "referenceLink": "",
    "notes": ""
  }
}
```

This structure is designed to be portable across systems and backward-compatible via `schemaVersion`.
