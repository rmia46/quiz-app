# HIS 102 & 205: Introduction to History & World Civilization Quiz

A modular assessment web application featuring 50 high-yield multiple-choice questions curated directly from lecture materials on:
- **Historical Methodology & Source Criticism** (Literary, Epigraphic, Numismatic, Archaeological, Oral)
- **Evolutionary Anthropology & Hominid Milestones** (Australopithecus to Homo sapiens, Lucy)
- **Scientific Chronology & Dating Techniques** (Radiocarbon C-14, Potassium-Argon, Epigraphy)
- **Civilizational Emergence & The Neolithic Revolution** (Food surplus, specialization, stratification)

## Question Distribution
- **Creative / Analytical (14 Questions):** Tests historiographical reasoning, cause-and-effect, and cross-source evaluation.
- **General / Conceptual (20 Questions):** Core terminology, scientific foundations, and auxiliary disciplines without rote year recall.
- **Mixed / Applied (16 Questions):** Contextual scenarios, source reliability limitations, and material evidence synthesis.

## Features
- **Sharp Academic Aesthetic**: High-contrast dark palette, `#a3e635` lime accents, serif headings, and sharp 0px borders.
- **Flexible Modes**:
  - **Timed Exam Mode**: Built-in countdown timer (30, 45, or 60 min), auto-submission on timeout, and question navigation drawer.
  - **Practice Mode**: Untimed with instant per-question rationale and correct answer validation.
- **Detailed Evaluation**: Score percentage, breakdown by question type, and itemized post-exam review.
- **Bulk Import Ready**: Includes `data/quizizz_import.csv` for 1-click import into Quizizz, Google Forms, or Testportal.

## Local Execution
Serve the app locally with any static web server:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000` in your browser.
