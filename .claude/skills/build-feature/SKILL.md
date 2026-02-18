---
name: build-feature
description: "Implement features from spec markdown files. Use when the user says /build-feature, 'implement this spec', 'build this feature', or provides a path to a spec .md file for implementation. Reads the spec, asks clarifying questions if anything is unclear or ambiguous, plans the implementation, optionally spawns a team for complex multi-domain work, then implements the feature following project conventions from CLAUDE.md."
triggers : [ 'build feature', 'create US', 'build us', 'create feature']
---

# Build Feature from Spec

Implement a feature described in a markdown spec file. Follow this workflow strictly.

## Workflow

### 1. Read & Understand the Spec

Read the spec file provided by the user. Identify:
- **Domain**: backend, frontend, 3D, full-stack
- **Scope**: number of files likely affected, new vs modified
- **Dependencies**: what existing code this touches

### 2. Analyze for Gaps

Use the checklist in [references/spec-analysis.md](references/spec-analysis.md) to identify missing or ambiguous information. Focus on what blocks implementation.

### 3. Ask Clarifying Questions (if needed)

If blockers or ambiguities exist, ask the user using `AskUserQuestion`. Rules:
- Max 4 questions per round, grouped by topic
- Provide suggested defaults so user can quickly confirm
- Skip this step entirely if the spec is clear and complete enough to implement
- Adapt language to the spec's language (French spec → French questions)

### 4. Plan Implementation

Enter plan mode (`EnterPlanMode`) to design the implementation:
- List files to create/modify with brief description of changes
- Identify the implementation order (backend first, then frontend typically)
- Note any new dependencies needed
- Flag any concerns (breaking changes, performance, migration needs)

### 5. Decide Solo vs Team

Evaluate complexity to decide execution mode:

**Solo** (default) — Use when:
- Single domain (backend only, or frontend only)
- < 5 files to modify
- No parallel workstreams possible

**Team** — Use when:
- Spec explicitly requests a team
- Multiple independent domains (e.g., 3D + UI modal, backend + frontend)
- Clear parallel workstreams that don't block each other
- > 8 files across different domains

When spawning a team:
- Create teammates with descriptive names matching their domain (e.g., "3d-animation", "ui-modal", "backend-api")
- Each teammate gets a clear task description with relevant spec sections
- Use `general-purpose` subagent type for teammates that need to write code
- Coordinate via task list — create tasks with dependencies

### 6. Implement

Execute the plan. Follow project conventions from CLAUDE.md:
- kebab-case files, standalone Angular components, signals for state
- Hono routes with Variables type, zValidator, ownership checks
- i18n keys in both en/fr JSON files
- Test that the code compiles (`npm run build` in relevant workspace)

## Spec Format Expectations

Specs can vary in structure. Common patterns observed:
- User story format ("En tant que... Je veux... Afin de...")
- Numbered sections describing mechanics
- Acceptance criteria / Definition of Done checklist
- Technical notes or suggestions

All formats are valid. Extract actionable requirements regardless of structure.
