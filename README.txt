CAREER COMPASS — FINAL PROJECT (DRAFT)

ALTERNATIVE ACCESS FOR THE TUTOR

The project is also available in the public GitHub repository:
https://github.com/Zayden-Zeng/career-compass-showcase
The repository provides an additional way to view the source and download
the complete project. Download and extract
the files, then follow the local run instructions below to open the browser
interface. The repository link is supplementary to the Ed code submission;
GitHub does not itself run the Python server.

PROJECT FILES

career_compass.py — main Python functionality and terminal interface.
server.py — starts the local server and connects the web interface to Python.
data.json — shared company, role, course and skill data.
role-location-review.json — excluded role records retained for location review.
README.txt — project description, instructions, concepts and AI disclosure.
test_integration.py — automated checks for key project functions.
audit_data.py — reads the dataset and reports data-quality information.
web/ — browser interface, map data, translations and visual assets.

Keep these files and the web folder together. The two checking scripts are
included for review but are not needed to start the application.

IMPORTANT: HOW TO RUN THE WEB INTERFACE

This is a Python project with a browser-based front end. It uses local web and
networking functionality, so the tutor needs to run it outside Ed's execution
environment. HTML, CSS and JavaScript provide the interface and map; AI tools
assisted with creating and improving the front end. Python provides the local
server, dataset validation, skill-gap analysis and course-to-role matching.
The front end also contains interactive display and visualisation logic.

Requirements: Python 3.10 or later and a modern web browser. The Python program
uses the standard library; no third-party Python packages are required.

1. Extract the complete project folder, keeping data.json and web/ alongside
   career_compass.py and server.py.
2. Open a terminal in that folder and run:

       python3 server.py

   On Windows, if appropriate, use: py server.py
3. Your default browser should open automatically. If it does not, visit
   http://127.0.0.1:8766/ manually. Keep the terminal running while using it.
4. Stop the server with Ctrl+C. For an alternative port, run
   python3 server.py --port 8767 and use the displayed local address.

For the separate terminal interface, run python3 career_compass.py.
Source links open external websites and require an internet connection.

1. PROJECT INTRODUCTION

1.1 Problem and motivation
Students can find it difficult to connect university courses and skills with
real career opportunities, and to understand where potential employers are
located. Career Compass brings these elements together for exploration.

I chose Shanghai because it is one of China's most developed cities, with a
wide range of industries and major employers offering potential opportunities
for computing graduates. Its international connections and diverse business
community also make it an interesting place for international students and
Chinese students returning from overseas to explore work and life. Individual
opportunities, eligibility and experiences vary.

1.2 Features and results
- Explore companies by location on a Shanghai map and browse recorded roles.
- Interact with the map through zooming and animated company markers; clicking
  Dishui Lake focuses on the lake and plays a fireworks Easter egg.
- Open role details, including recorded skills and links to sources.
- Select university courses to find roles related to their mapped skills.
- The six-direction course profile visualises course coverage, with a
  "Hexagon Ranger" milestone for reaching its coverage thresholds; it is an
  exploration feature, not a professional skills certification.
- Mark self-reported skills for a role and receive a skill-gap analysis and
  related course suggestions. A match is not proof of competence or eligibility.
- Explore the interface in Chinese, English or Arabic; the terminal interface
  supports Chinese and English.
- Save a terminal study plan as JSON; browser bookmarks are stored locally.

1.3 Sources and limitations
The dataset includes source links and verification dates for many records;
links to recorded sources can be opened through the interface. Records were
collected at different times and not every source or location has been freshly
verified. Jobs may close or change, pages may disappear, and company locations,
course details and inferred skill mappings may be inaccurate or incomplete.
A recorded role is not necessarily an active vacancy. Users should check the
original employer or university source before making decisions.

2. PYTHON CONCEPTS

Week references below follow the COMP9001 lecture numbering.

2.1 Foundations
- Variables and data types (Week 2): strings, numbers, lists and
  dictionaries represent companies, roles, skills and course information.
- Conditionals (Week 3) and loops (Week 5): validate choices and iterate
  through companies, roles, skills and mappings.
- Functions (Week 6): organise validation, skill matching, recommendations
  and menu interactions into named, reusable operations.

2.2 Advanced concepts and supporting technology
- File input/output (Week 9): load data.json and save/load a study plan in
  JSON; see load_dataset, save_profile and load_profile in career_compass.py.
- Exception handling: report file, JSON and invalid-input errors; see
  load_dataset, save_profile and load_profile. Some malformed-but-valid
  profile data can still trigger an error, as noted below.
- Nested lists and dictionaries: represent companies containing roles and
  skills, and course-to-skill mappings; course_matches in server.py traverses
  these relationships to produce related roles.
- The standard-library HTTP server and HTML/CSS/JavaScript support the browser
  interface. They are supporting web technologies, not third-party Python
  packages. This is a local demonstration server, not production hosting.

3. AI ACKNOWLEDGEMENT

I began developing the product idea with AI assistance in Week 3. At my level
of programming experience, implementing the full idea to the standard I wanted
would have been difficult without help. I used AI as a learning aid while
gradually building the project, reviewing suggestions and exploring how the
code works.

AI assisted with the browser front end, including the map, interactive company
and role views, course exploration, visual design and language support. AI also
helped search online for substantial amounts of real-world company, job and
course information, organise the records and encode them in project data files.
Sources and verification dates vary, and the information may be incomplete,
inaccurate or outdated; please check the original sources.

AI assisted with finding company logos and improving the clarity or rendering
of some images, and with visual effects such as animated markers and the Dishui
Lake fireworks. AI also assisted in obtaining and integrating geographical
data, including OpenStreetMap-derived map features, to make the map more
geographically faithful. Map geometry and company locations remain approximate
and require checking; this description does not imply a live map API call when
the application runs.

AI also assisted with parts of the Python implementation. Examples include:
- Connecting the Python local server and browser using JSON requests.
- Matching selected courses to role skills across nested data and ranking the
  resulting records.
- Validating the dataset and handling file and JSON errors when loading or
  saving information.

Tools used include Doubao, OpenAI Codex and DeepSeek. AI also assisted with
data integration, review, testing and documentation.

4. FILES, CHECKS AND KNOWN LIMITATIONS

career_compass.py — terminal interface and Python matching functions.
server.py — local server and endpoints for the browser interface.
data.json — shared company, role, skill and course data.
web/ — browser interface, map and visual assets.
test_integration.py — automated checks of dataset consistency, role and course
  matching, skill normalisation, input handling, and terminal plan saving and
  loading. Its save/load test uses a temporary directory. It is not required
  to start the application and does not verify that external job listings
  or company addresses are current.
audit_data.py — reads data.json and prints a summary of recorded role status,
  source-access information, course-skill mapping coverage and missing dates.
  It does not change data.json or independently verify the source records.
  It is not required to start the application.

Both are Python checking scripts, not separate datasets. Include them with the
project for review. The application's main dataset is data.json.

Run checks: python3 -m unittest test_integration.py
Validate data: python3 career_compass.py --validate
Data report: python3 audit_data.py

Eight integration tests passed during the review on 28 October 2026. This does
not establish that every visual interaction, source and vacancy was verified.
A missing data.json currently prevents startup with a traceback. A valid JSON
profile with incorrect field types may also cause a terminal error. Back up a
saved profile before replacing it. Browser bookmarks and terminal profiles are
separate and do not synchronise.
