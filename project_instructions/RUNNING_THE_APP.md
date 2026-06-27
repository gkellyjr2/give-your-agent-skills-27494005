# Running the Project Intake Web Page

This project uses a lightweight Node.js server to host the page and persist submissions.

## Flow Overview

The app now uses a three-page request flow:

- Intake page: capture request details and select Preview Submission.
- Review page: verify readable values by category, then either submit or return to edit.
- Acknowledgment page: confirms successful submission using the project title and offers next actions.

## Prerequisites

- Node.js 18+ installed
- npm available on your PATH

## Start the Server

From the repository root, run:

```bash
npm start
```

Expected startup output includes:

- `Project intake app running at http://localhost:3000`
- `Submissions persist in project_submissions`

If startup fails with `EADDRINUSE`, port 3000 is already in use. Stop the other process or run with a different port:

```bash
PORT=3001 npm start
```

## Open the Web Page

If you are running locally on your own machine, open:

```text
http://localhost:3000
```

If you used a custom port, replace `3000` with your configured port.

If you are running in GitHub Codespaces, use the forwarded URL instead of localhost:

```text
https://<CODESPACE_NAME>-3000.<GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN>
```

You can print the exact URL for your current Codespace with:

```bash
echo "https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
```

Why this matters: the server runs inside the container. `localhost` in your desktop browser points to your own machine, not the Codespace container, unless the port is forwarded and opened through the Codespaces URL.

## Complete a Request

1. On the intake page, enter required and optional request details.
2. Select Preview Submission to validate entries and open the review page.
3. On the review page, either:
   - Select Return to Edit to go back and correct values.
   - Select Submit Request to persist the request.
4. On the acknowledgment page, confirm submission success and choose one action:
   - Submit Additional Request: returns to a clean intake page.
   - Close App: attempts to close the app tab/window.

## Validate JavaScript (Optional)

To run syntax checks for both client and server scripts:

```bash
npm run check
```

## Where Submissions Are Saved

Submission files are written to:

```text
project_submissions/
```

Each submission is saved as an individual JSON file.

## Stop the Server

In the terminal running the server, press:

```text
Ctrl+C
```
