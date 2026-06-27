# Project Intake Page User Guide

This page captures all required information to submit a project request for review and planning.

## How to Use the Page

1. Open the intake page in a browser.
2. Complete all required fields (marked with `*`).
3. Fill optional fields where useful context exists.
4. Select **Preview Submission**.
5. Review your request on the separate review page in a readable category-based format.
6. Choose **Submit Request** to finalize, or **Return to Edit** to update responses.
7. After submission, use the acknowledgment page to either submit an additional request or close the app.

A request moves to the review page only when all required fields are valid.

## Required Fields and Definitions

The following fields are required for successful submission:

1. **Full Name**
   Definition: Name of the person requesting the project.
   Data type: Text.

2. **Work Email**
   Definition: Business email of the requestor for follow-up.
   Data type: Email format (example: name@company.com).

3. **Department**
   Definition: Organization unit that owns or sponsors the request.
   Data type: Text.

4. **Project Title**
   Definition: Short, descriptive name for the requested initiative.
   Data type: Text.

5. **Project Summary**
   Definition: Brief overview of what is being requested.
   Data type: Multi-line text.

6. **Problem Statement**
   Definition: The specific issue or gap that needs to be solved.
   Data type: Multi-line text.

7. **Desired Outcome**
   Definition: The target business or user result expected from delivery.
   Data type: Multi-line text.

8. **Request Type**
   Definition: Category of work being requested (for example, New Build, Enhancement).
   Data type: Single select dropdown.

9. **Priority**
   Definition: Relative urgency of the project request.
   Data type: Single select dropdown.

10. **Desired Start Date**
    Definition: Requested date to begin the project.
    Data type: Date.

11. **Desired Completion Date**
    Definition: Requested completion date.
    Data type: Date.
    Validation rule: Completion date must be the same as or later than start date.

12. **Success Metrics**
    Definition: Measurable outcomes used to judge project success.
    Data type: Multi-line text.

13. **Data Sensitivity**
    Definition: Highest sensitivity level of data touched by the project.
    Data type: Single select dropdown.

## Optional Fields and Definitions

These fields are optional but recommended when available:

1. **Role**: Requestor job title or function.
2. **Estimated Budget (USD)**: Approximate funding range or budget amount.
3. **Primary Stakeholders**: Teams or individuals with direct interest.
4. **Dependencies**: Required systems, approvals, vendors, or upstream tasks.
5. **Key Risks or Constraints**: Known risks, limitations, or blockers.
6. **Reference Link**: URL to supporting requirements or design docs.
7. **Additional Notes**: Any extra context not captured elsewhere.

## Submission Outcome

On successful submission:

- An acknowledgment page confirms successful submission and includes the project title.
- The acknowledgment page provides two actions: submit an additional request or close the app.
- A JSON file is written to the local storage folder `project_submissions/`.

On validation failure:

- The page highlights invalid fields.
- A corrective message explains what must be fixed.
