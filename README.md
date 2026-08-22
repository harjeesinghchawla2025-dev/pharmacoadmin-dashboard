# PharmacoAdmin Dashboard

Update the existing React/Vite project to implement the Member 4 Admin Dashboard.

IMPORTANT:

Do NOT rebuild or restructure the entire project.

Do NOT delete existing pages/components.

Preserve the current project structure and styling.

Work primarily with:
src/pages/admin/AdminDashboard.jsx
src/App.jsx
src/App.css
src/index.css

Keep the existing auth, doctor, and patient folders untouched unless routing integration is required.

Use the existing dependencies already installed in the project.

Do not add unnecessary libraries.

Build a professional Admin Dashboard for the Pharmacogenomics Database Management System.

Dashboard requirements:

STATISTICS CARDS

Create cards for:

Total Users

Total Patients

Total Doctors

Total Drugs

Total Genes

Total Genetic Variants

Total Recommendations

Total Prescriptions

The dashboard should be designed so these values can later be populated from the backend/MySQL API.

For the current development/demo state, use clearly separated mock/fallback data if the backend API is not yet connected.

Current database statistics available for reference:

Patients: 1

Drugs: 3762

Genes: 25041

Variants: 7615

Recommendations: 1

Prescriptions: 0

Users: 0

ANALYTICS SECTION

Create visual analytics for:

A. Recommendations by Type

Current data:

Alternative: 1

The design should support:

Recommended

Avoid

Dose Adjustment

Alternative

B. Top Drugs by Drug-Gene Interactions

Current top results:

fluorouracil: 617

methotrexate: 444

opioids: 338

cisplatin: 332

cyclophosphamide: 330

capecitabine: 326

methadone: 290

doxorubicin: 263

antipsychotics: 254

risperidone: 249

C. Top Genes by Drug-Gene Interactions

Current top results:

ABCB1: 885

RYR1: 402

DPYD: 385

CYP3A4: 370

CYP2D6: 369

CYP2C19: 365

OPRM1: 330

SLCO1B1: 295

CFTR: 285

CYP2C9: 268

RECENT RECOMMENDATIONS

Create a table showing:

Patient

Drug

Gene

Variant

Recommendation Type

Recommendation

Source

Status

Use the existing test case as development data:

Patient: TEST-P001
Drug: rosuvastatin
Gene: SLCO1B1
Variant: rs4149056
Recommendation Type: Alternative
Source: PharmGKB
Status: Active

GUIDELINE INFORMATION

Include a section showing that the rosuvastatin test case has:

CPIC guideline:
Annotation of CPIC Guideline for rosuvastatin and ABCG2, SLCO1B1

DPWG guideline:
Annotation of DPWG Guideline for rosuvastatin and SLCO1B1

ADMIN NAVIGATION

Create a sidebar/navigation structure with:

Dashboard

User Management

Drug Database

Genetic Database

Recommendations

Reports

Analytics

Audit Logs

Activity Logs

System Settings

Only Dashboard needs to be fully functional in this phase. The other items can be navigation placeholders for later phases.

UI REQUIREMENTS

Make the dashboard look like a real medical/pharmacogenomics administration system.

Use:

Clean professional layout

Responsive design

Sidebar

Header

Statistics cards

Tables

Charts

Consistent spacing

Clear typography

Loading/error states where appropriate

Do not use excessive animations.

BACKEND PREPARATION

Structure the frontend so that the hardcoded/mock statistics can later be replaced with API calls.

Create a clean service/API abstraction rather than scattering fetch calls throughout the UI.

Do not invent a backend API that does not exist yet.

At the end, make sure the project still builds successfully with the existing Vite setup.

Do not modify the database schema in this phase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4bf54be7-04e7-49de-b264-508510dfb9c4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
