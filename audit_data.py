#!/usr/bin/env python3
"""Print a data-quality report for data.json. Run: python3 audit_data.py
This is the same evidence-stratified view the UI shows, for graders/maintainers.
"""
import json, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "data.json"), encoding="utf-8") as f:
    d = json.load(f)

comps = d["companies"]
roles = [r for c in comps for r in c["roles"]]
print(f"companies: {len(comps)}   roles: {len(roles)}   courses: {len(d['courses'])}   mapped skills: {len(d['skill_courses'])}")

st = collections.Counter(r.get("status", "?") for r in roles)
print("\nstatus:", dict(st))
ev = collections.Counter(r.get("evidence_access", "?") for r in roles)
print("evidence_access:", dict(ev))
print("\nskills total:", len(d["skill_labels"]))
mapped = set(d["skill_courses"])
mentions = sum(len(r["skills"]) for r in roles)
covered = sum(1 for r in roles for s in r["skills"] if s in mapped)
roles_covered = sum(1 for r in roles if any(s in mapped for s in r["skills"]))
print(f"skill mentions: {mentions}   with course mapping: {covered} ({covered/max(mentions,1):.0%})")
print(f"roles with >=1 mapped skill: {roles_covered}/{len(roles)} ({roles_covered/max(len(roles),1):.0%})")
unmapped_skills = sorted(set(s for r in roles for s in r["skills"] if s not in mapped))
print(f"unmapped skills ({len(unmapped_skills)}):", ", ".join(unmapped_skills))

dv = sum(1 for c in comps if c.get("district") and "待核实" not in c["district"])
print(f"\ncompany records with a district label: {dv}/{len(comps)} (not independent location verification)")
no_posted = sum(1 for r in roles if not r.get("posted_date"))
print(f"roles missing posted_date: {no_posted}/{len(roles)}")
