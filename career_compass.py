"""Career Compass: run python3 career_compass.py for the terminal interface.
Run python3 server.py for the connected web interface.
AI assistance: Doubao assisted the earlier prototype. OpenAI Codex assisted
with the web interface, dataset integration, Python server and verification.
Source dates are retained from the existing dataset, not freshly verified.
"""
import json
import os
import sys

# Shared dataset used by both terminal and web interfaces.
def load_dataset():
    path = os.path.join(os.path.dirname(__file__), "data.json")
    try:
        with open(path, encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError("Cannot read data.json: " + str(error)) from error

DATA = load_dataset()
COURSES = DATA["courses"]
SKILL_COURSES = DATA["skill_courses"]
SKILL_ALIASES = DATA.get("skill_aliases", {})


def normalize_skill(name, aliases=SKILL_ALIASES):
    """Resolve a skill name (possibly a Chinese alias or a legacy spelling)
    to its canonical English key used across data.json, course mappings and
    the user's mastered-skill selections. Unknown names pass through unchanged.
    """
    return aliases.get(name, name)


def validate_dataset():
    """Check that data.json is internally consistent, raising a clear error
    otherwise. Run at import so a broken dataset fails fast for both the
    terminal and the web server instead of mis-behaving silently.
    """
    problems = []
    uids = set()
    course_codes = set(COURSES)
    for company in DATA["companies"]:
        if not isinstance(company.get("roles"), list):
            problems.append("company %r has no roles list" % company.get("id"))
            continue
        for role in company["roles"]:
            uid = role.get("uid")
            if not uid:
                problems.append("role without uid in company %r" % company.get("id"))
            elif uid in uids:
                problems.append("duplicate role uid %r" % uid)
            else:
                uids.add(uid)
            if not role.get("source_url"):
                problems.append("role %r missing source_url" % uid)
    for skill, pairs in SKILL_COURSES.items():
        for code, _reason in pairs:
            if code not in course_codes:
                problems.append("skill %r maps to unknown course %r" % (skill, code))
    if problems:
        raise RuntimeError("data.json is inconsistent: " + "; ".join(problems[:20]))
    return True


validate_dataset()
INDUSTRIES = []
for company_number, company in enumerate(DATA["companies"], 1):
    roles = []
    for role_number, original in enumerate(company["roles"], 1):
        role = dict(original)
        role["id"] = role_number
        role["source"] = original.get("source_url", "Source not recorded")
        roles.append(role)
    INDUSTRIES.append({"id": company_number,
        "name": {"zh": company["name"], "en": company.get("english", company["name"])},
        "roles": roles})

EXPERIENCE_TAGS = {
    "graduate": {"zh": "应届", "en": "Graduate"},
    "intern": {"zh": "实习", "en": "Internship"},
    "experienced": {"zh": "有经验", "en": "Experienced"}
}

# The profile file always lives in the same folder as this script, so the
# program can be run from any directory. A plain relative name like
# "profile.json" would refer to the current working directory, which may
# be read-only (for example the root folder "/" on macOS).
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILE_PATH = os.path.join(SCRIPT_DIR, "profile.json")

# ----------------------------------------------------------------------
# 2. UI STRINGS (bilingual)
# ----------------------------------------------------------------------

BANNER = "=== Career Compass 职业指南针 / Career Compass ==="

TEXTS = {
    "zh": {
        "choose_lang": "选择语言 / choose language (1 中文 / 2 English): ",
        "invalid": "无效输入，请重新输入。",
        "demo_note": "数据说明：岗位与课程记录包含来源和不同的核查日期；岗位当前是否开放、课程详情和匹配关系仍需查看原始来源确认。",
        "profile_not_found": "还没有保存的学习计划。",
        "profile_corrupt": "profile.json 损坏或格式不对，已从空档案开始（原文件不会被覆盖，直到你再次保存）。",
        "saved_plan_hint": "检测到已保存的学习计划，可在主菜单选择 2 查看。",
        "main_menu": "主菜单",
        "main_explore": "开始新的职业探索",
        "main_saved": "查看已保存的学习计划",
        "main_exit": "退出",
        "choose": "请选择: ",
        "city_menu": "选择城市",
        "industry_menu": "选择公司",
        "roles_unit": " 个岗位",
        "role_menu": "选择岗位",
        "back": "返回",
        "no_industry": "没有这个公司编号。",
        "no_role": "没有这个岗位编号。",
        "role_detail": "岗位详情",
        "role_title": "岗位",
        "industry": "公司",
        "description": "工作内容",
        "skills": "技能要求",
        "experience": "经验要求",
        "source": "数据来源",
        "related_courses": "相关课程",
        "no_course": "（暂无对应课程，建议课外实践）",
        "unmapped": "以下技能暂无对应课程，建议课外实践或项目练习：",
        "select_skills": "选择你已掌握的技能（输入编号可多选，输入 0 结束）：",
        "added": "已添加：",
        "duplicate": "这个技能已经选过了。",
        "your_skills": "你已掌握的技能",
        "none": "（无）",
        "gap_analysis": "技能差距分析",
        "missing": "缺少的技能",
        "all_covered": "你已自行标记该记录中的所有技能；这不代表符合全部招聘要求。",
        "recommendations": "学习建议",
        "save": "是否保存学习计划到 profile.json？(1 保存 / 0 不保存): ",
        "saved": "学习计划已保存到 profile.json。",
        "not_saved": "未保存。",
        "save_failed": "保存失败：无法写入文件，请检查所在文件夹权限。",
        "saved_plan": "已保存的学习计划",
        "target_role": "目标岗位",
        "goodbye": "再见！"
    },
    "en": {
        "choose_lang": "选择语言 / choose language (1 中文 / 2 English): ",
        "invalid": "Invalid input, please try again.",
        "demo_note": "Data note: role and course records include sources and varying verification dates. Check the original sources for current vacancies, course details and suitability.",
        "profile_not_found": "No saved study plan yet.",
        "profile_corrupt": "profile.json is damaged or malformed; starting with an empty profile (the original file will not be overwritten until you save again).",
        "saved_plan_hint": "A saved study plan was found; choose 2 in the main menu to view it.",
        "main_menu": "Main menu",
        "main_explore": "Start a new career exploration",
        "main_saved": "View saved study plan",
        "main_exit": "Exit",
        "choose": "Please choose: ",
        "city_menu": "Choose a city",
        "industry_menu": "Choose a company",
        "roles_unit": " roles",
        "role_menu": "Choose a role",
        "back": "Back",
        "no_industry": "No such company.",
        "no_role": "No such role.",
        "role_detail": "Role details",
        "role_title": "Role",
        "industry": "Company",
        "description": "Responsibilities",
        "skills": "Required skills",
        "experience": "Experience",
        "source": "Source",
        "related_courses": "Related subjects",
        "no_course": "(No subject mapping; practice outside the classroom)",
        "unmapped": "No subject covers these skills; consider extra practice or projects:",
        "select_skills": "Select the skills you already have (enter numbers, multiple allowed, 0 to finish): ",
        "added": "Added: ",
        "duplicate": "Already selected.",
        "your_skills": "Your existing skills",
        "none": "(none)",
        "gap_analysis": "Skill gap analysis",
        "missing": "Missing skills",
        "all_covered": "You marked all recorded skills; this does not confirm job eligibility.",
        "recommendations": "Study suggestions",
        "save": "Save this study plan to profile.json? (1 save / 0 skip): ",
        "saved": "Study plan saved to profile.json.",
        "not_saved": "Not saved.",
        "save_failed": "Save failed: cannot write the file. Check folder permissions.",
        "saved_plan": "Saved study plan",
        "target_role": "Target role",
        "goodbye": "Goodbye!"
    }
}

# ----------------------------------------------------------------------
# 3. HELPERS
# ----------------------------------------------------------------------


def t(lang, key):
    """Return the UI string for a key in the given language."""
    return TEXTS[lang][key]


# Global language state so the user can switch at any input prompt.
CURRENT_LANG = "en"


def set_lang(lang):
    """Set the global UI language."""
    global CURRENT_LANG
    CURRENT_LANG = lang


def ask(prompt):
    """Wrapper around input(): if the user types 'change language'
    (case-insensitive), toggle between Chinese and English and return
    the special value '__LANG_SWITCHED__' so the caller can redraw."""
    global CURRENT_LANG
    raw = input(prompt)
    if raw.strip().lower() == "change language":
        CURRENT_LANG = "zh" if CURRENT_LANG == "en" else "en"
        label = "中文" if CURRENT_LANG == "zh" else "English"
        print(">> Language switched to: " + label)
        return "__LANG_SWITCHED__"
    return raw


def find_industry(industry_id):
    """Return the industry dict with the given id, or None."""
    for industry in INDUSTRIES:
        if industry["id"] == industry_id:
            return industry
    return None


def find_role(industry_id, role_id):
    """Return the role dict with the given ids, or None."""
    industry = find_industry(industry_id)
    if industry is None:
        return None
    for role in industry["roles"]:
        if role["id"] == role_id:
            return role
    return None


def get_missing_skills(role, mastered_skills):
    """Return the role's required skills that the user does not master.

    This is the core gap-analysis algorithm: required skills minus
    existing skills, keeping the order of the requirement list. Both sides
    are normalised so that a Chinese alias (e.g. "机器学习") matches its
    canonical English key ("Machine Learning").
    """
    mastered = {normalize_skill(s) for s in mastered_skills}
    missing = []
    for skill in role["skills"]:
        if skill not in mastered:
            missing.append(skill)
    return missing


def recommend_courses(skills, lang):
    """Return (recommendations, unmapped) for the given skills.

    recommendations: list of dicts {"code", "reasons"}, with duplicate
    courses merged and all reasons preserved.
    unmapped: list of skills that have no subject mapping.
    """
    recommendations = []
    seen = {}
    unmapped = []
    for skill in skills:
        canonical = normalize_skill(skill)
        mapping = SKILL_COURSES.get(canonical)
        if mapping is None:
            unmapped.append(canonical)
            continue
        for code, reason in mapping:
            if code not in seen:
                seen[code] = {"code": code, "reasons": []}
                recommendations.append(seen[code])
            seen[code]["reasons"].append(reason.get(lang, reason.get("en", "")))
    # Rank courses that cover more of the missing skills first. Python's sort is
    # stable, so equally strong courses keep their first-seen order.
    recommendations.sort(key=lambda rec: -len(rec["reasons"]))
    return recommendations, unmapped


def course_name(code, lang):
    """Return the course display name, falling back to the code."""
    name = COURSES.get(code, {}).get("name", {}).get(lang)
    if name is None:
        return code
    return name


def print_recommendations(recommendations, unmapped, lang):
    """Print merged course recommendations and any unmapped skills."""
    if recommendations:
        for rec in recommendations:
            print("- " + rec["code"] + ": " + course_name(rec["code"], lang))
            for reason in rec["reasons"]:
                print("    " + reason)
    else:
        print("  " + t(lang, "no_course"))
    if unmapped:
        print(t(lang, "unmapped") + " " + ", ".join(unmapped))


# ----------------------------------------------------------------------
# 4. FILE I/O (advanced topic: persistence)
# ----------------------------------------------------------------------


def save_profile(profile, path=PROFILE_PATH):
    """Write the profile dictionary to a JSON file.

    Returns True on success. Returns False (instead of crashing) if the
    file cannot be written, for example because the folder is read-only.
    """
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)
        return True
    except OSError as error:
        print("Failed to write profile file:", error)
        return False


def load_profile(path=PROFILE_PATH):
    """Load a profile from a JSON file.

    Returns (profile_dict, status). Status is one of:
      "ok"      - the file was read successfully
      "missing" - the file does not exist
      "corrupt" - the file exists but cannot be parsed
    A missing or corrupt file yields an empty profile and the original
    file is never overwritten by this function.
    """
    if not os.path.exists(path):
        return {}, "missing"
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {}, "corrupt"
        return data, "ok"
    except (json.JSONDecodeError, OSError):
        return {}, "corrupt"


# ----------------------------------------------------------------------
# 5. DISPLAY FUNCTIONS
# ----------------------------------------------------------------------


def display_role(role, industry, lang):
    """Print the full details of a role, including related subjects."""
    print()
    print("=== " + t(lang, "role_detail") + " ===")
    print(t(lang, "role_title") + ": " + role["title"][lang])
    print(t(lang, "industry") + ": " + industry["name"][lang])
    print(t(lang, "description") + ": " + role["description"][lang])
    print(t(lang, "skills") + ": " + ", ".join(role["skills"]))
    tag = EXPERIENCE_TAGS.get(role["experience"]["type"], {"en": role["experience"]["type"], "zh": role["experience"]["type"]})[lang]
    print(t(lang, "experience") + ": " + tag + " - " + role["experience"][lang])
    print(t(lang, "source") + ": " + role["source"])

    print()
    print(t(lang, "related_courses") + ":")
    recs, unmapped = recommend_courses(role["skills"], lang)
    print_recommendations(recs, unmapped, lang)


def select_mastered_skills(role, lang):
    """Let the user pick the skills they already master.

    Returns a list of skill names without duplicates.
    """
    print()
    print(t(lang, "select_skills"))
    skills = role["skills"]
    for i in range(len(skills)):
        print(i + 1, skills[i])

    mastered = []
    prev_lang = CURRENT_LANG
    while True:
        if CURRENT_LANG != prev_lang:
            prev_lang = CURRENT_LANG
            print()
            print(t(CURRENT_LANG, "select_skills"))
            for i in range(len(skills)):
                print(i + 1, skills[i])
        lang = CURRENT_LANG
        choice = ask(t(lang, "choose"))
        if choice == "__LANG_SWITCHED__":
            continue
        if choice == "0":
            break
        try:
            num = int(choice)
        except ValueError:
            print(t(lang, "invalid"))
            continue
        if 1 <= num <= len(skills):
            skill = skills[num - 1]
            if skill not in mastered:
                mastered.append(skill)
                print(t(lang, "added") + skill)
            else:
                print(t(lang, "duplicate"))
        else:
            print(t(lang, "invalid"))
    return mastered


def show_gap(mastered, missing, recommendations, unmapped, lang):
    """Print the skill gap analysis and study suggestions."""
    print()
    print("=== " + t(lang, "gap_analysis") + " ===")
    shown = ", ".join(mastered) if mastered else t(lang, "none")
    print(t(lang, "your_skills") + ": " + shown)
    if not missing:
        print(t(lang, "all_covered"))
        return
    print(t(lang, "missing") + ": " + ", ".join(missing))
    print(t(lang, "recommendations") + ":")
    print_recommendations(recommendations, unmapped, lang)


def show_profile(lang):
    """Print the saved study plan, if any."""
    profile, status = load_profile()
    if status == "missing":
        print(t(lang, "profile_not_found"))
        return
    if status == "corrupt":
        print(t(lang, "profile_corrupt"))
        return
    print("=== " + t(lang, "saved_plan") + " ===")
    print(t(lang, "target_role") + ": " + str(profile.get("target_role", "?")))
    print(t(lang, "your_skills") + ": " + ", ".join(profile.get("mastered_skills", [])))
    print(t(lang, "missing") + ": " + ", ".join(profile.get("missing_skills", [])))
    print(t(lang, "recommendations") + ": " + ", ".join(profile.get("recommended_courses", [])))


# ----------------------------------------------------------------------
# 6. MAIN FLOW
# ----------------------------------------------------------------------


def choose_language():
    """Ask for the UI language until a valid choice is entered."""
    while True:
        print(BANNER)
        choice = input(TEXTS["zh"]["choose_lang"])
        if choice == "1":
            return "zh"
        if choice == "2":
            return "en"
        print(TEXTS["zh"]["invalid"])


def explore(lang):
    """City -> region -> role -> details -> skills -> plan."""
    while True:
        lang = CURRENT_LANG
        print()
        print("=== " + t(lang, "city_menu") + " ===")
        print("1 Shanghai")
        print("0", t(lang, "back"))
        city_choice = ask(t(lang, "choose"))
        if city_choice == "__LANG_SWITCHED__":
            continue
        if city_choice == "0":
            return
        if city_choice != "1":
            print(t(lang, "invalid"))
            continue
        break

    while True:
        lang = CURRENT_LANG
        print()
        print("=== " + t(lang, "industry_menu") + " ===")
        for industry in INDUSTRIES:
            count = len(industry["roles"])
            print(industry["id"], industry["name"][lang] + " - " + str(count) + t(lang, "roles_unit"))
        print("0", t(lang, "back"))
        industry_choice = ask(t(lang, "choose"))
        if industry_choice == "__LANG_SWITCHED__":
            continue

        if industry_choice == "0":
            return
        try:
            industry_id = int(industry_choice)
        except ValueError:
            print(t(lang, "invalid"))
            continue

        industry = find_industry(industry_id)
        if industry is None:
            print(t(lang, "no_industry"))
            continue

        while True:
            lang = CURRENT_LANG
            print()
            print("=== " + t(lang, "role_menu") + " ===")
            for role in industry["roles"]:
                print(role["id"], role["title"][lang])
            print("0", t(lang, "back"))
            role_choice = ask(t(lang, "choose"))
            if role_choice == "__LANG_SWITCHED__":
                continue

            if role_choice == "0":
                break
            try:
                role_id = int(role_choice)
            except ValueError:
                print(t(lang, "invalid"))
                continue

            role = find_role(industry["id"], role_id)
            if role is None:
                print(t(lang, "no_role"))
                continue

            display_role(role, industry, lang)
            mastered = select_mastered_skills(role, lang)
            missing = get_missing_skills(role, mastered)
            recommendations, unmapped = recommend_courses(missing, lang)
            show_gap(mastered, missing, recommendations, unmapped, lang)

            profile = {
                "target_industry": industry["name"][lang],
                "target_role": role["title"][lang],
                "mastered_skills": mastered,
                "missing_skills": missing,
                "recommended_courses": [rec["code"] for rec in recommendations]
            }

            print()
            while True:
                lang = CURRENT_LANG
                answer = ask(t(lang, "save"))
                if answer == "__LANG_SWITCHED__":
                    continue
                if answer == "1":
                    if save_profile(profile):
                        print(t(lang, "saved"))
                    else:
                        print(t(lang, "save_failed"))
                    break
                elif answer == "0":
                    print(t(lang, "not_saved"))
                    break
                else:
                    print(t(lang, "invalid"))
            return


def main():
    """Program entry point: language choice, main menu loop."""
    lang = choose_language()
    set_lang(lang)
    print(t(lang, "demo_note"))

    profile, status = load_profile()
    if status == "missing":
        print(t(lang, "profile_not_found"))
    elif status == "corrupt":
        print(t(lang, "profile_corrupt"))
    else:
        print(t(lang, "saved_plan_hint"))

    while True:
        lang = CURRENT_LANG
        print()
        print("=== " + t(lang, "main_menu") + " ===")
        print("1", t(lang, "main_explore"))
        print("2", t(lang, "main_saved"))
        print("0", t(lang, "main_exit"))
        choice = ask(t(lang, "choose"))
        if choice == "__LANG_SWITCHED__":
            continue

        if choice == "0":
            print(t(lang, "goodbye"))
            break
        elif choice == "1":
            explore(lang)
        elif choice == "2":
            show_profile(lang)
        else:
            print(t(lang, "invalid"))


def _cli():
    """Non-interactive entry point used by CI and quick checks."""
    if "--help" in sys.argv:
        print("python3 career_compass.py             interactive terminal")
        print("python3 career_compass.py --validate   dataset consistency check (exit 1 on failure)")
        return 0
    if "--validate" in sys.argv:
        try:
            validate_dataset()
            counts = (len(DATA["companies"]),
                      sum(len(c.get("roles", [])) for c in DATA["companies"]),
                      len(COURSES), len(SKILL_COURSES))
            print("OK: dataset valid - %d companies, %d roles, %d courses, %d skill mappings" % counts)
            return 0
        except Exception as error:  # noqa: BLE001
            print("FAIL: " + str(error))
            return 1
    try:
        main()
    except (EOFError, KeyboardInterrupt):
        print("\nInput ended; exiting Career Compass.")
    return 0


if __name__ == "__main__":
    sys.exit(_cli())

