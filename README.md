# Career Compass

**Explore Shanghai careers through places, skills and university courses.**

Career Compass helps computing students discover where employers are located, explore recorded technology roles and see how selected courses relate to skills in those roles. A Python program powers the data and matching, with a terminal interface and an interactive browser experience.

![Career Compass welcome screen](screenshots/Screenshots-Welcome.png)

## Explore Shanghai

Browse the city map, choose a district and explore company locations and recorded roles. Nearby companies can expand into an interactive galaxy of logos; markers distinguish companies with role records from company-only entries.

![Shanghai map and company explorer](screenshots/Screenshots-first_page.png)
![Companies in Pudong](screenshots/Screenshots-Pudong-Map.png)
![Company galaxy](screenshots/Screenshots-Company-Galaxy.png)

## Connect courses and careers

Select courses to explore related roles and the skills connecting them. The six-direction course profile visualises breadth of course coverage, and milestones celebrate progress. Course coverage is not a measure of skill mastery or a guarantee of eligibility.

![Courses, related roles and six-direction profile](screenshots/Screenshots-Course-Matching-Hexagon.png)
![Course milestone](screenshots/Screenshots-Course-Milestone.png)

## Discover Dishui Lake

Click Dishui Lake on the map to focus on the lake and enjoy the fireworks Easter egg.

![Dishui Lake fireworks](screenshots/Screenshots-Dishui-Fireworks.png)
![Dishui Lake fireworks finale](screenshots/Screenshots-Dishui-Fireworks-Finale.png)

## Languages

The browser interface supports Chinese, English and Arabic. The terminal interface supports Chinese and English.

![Chinese interface](screenshots/Screenshots-Chinese-Interface.png)
![Arabic interface](screenshots/Screenshots-Arabic-Interface.png)

## Download and run

1. Choose **Code → Download ZIP** on this page and extract the archive.
2. Open a terminal in the extracted folder and run `python3 server.py` (Windows: `py server.py`).
3. The browser should open automatically. If it does not, visit http://127.0.0.1:8766/ on the same computer. Keep the terminal open while using the app.
4. To explore the terminal interface instead, run `python3 career_compass.py`.

Python 3.10 or later and a web browser are needed. No third-party Python packages are required. This local web application needs to run outside Ed. See [README.txt](README.txt) for detailed setup, code structure, limitations and AI acknowledgement. GitHub is an additional access route; code submission is through Ed.

**Data note:** Records were collected at different times and may be incomplete or out of date. A recorded role is not necessarily open. Check the original sources before relying on job, location or course information.
