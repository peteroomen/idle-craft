import { Fetcher } from "swr";
import { Skill } from "../models/skill";

const API_BASE = "/api";
const SKILLS_BASE = "/skills";

export const fetchSkills: Fetcher<Skill[], string> = 
    () => fetch(API_BASE + SKILLS_BASE).then((res) => res.json());

export const fetchSkillByRoute: Fetcher<Skill, string> = 
    (route) => fetch(`${API_BASE}${SKILLS_BASE}/${route}`).then((res) => res.json());