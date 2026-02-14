# Spec Analysis Checklist

## Completeness Check

For each spec, verify these areas are addressed. Missing items become clarification questions.

### Backend
- [ ] API endpoints clearly defined (HTTP method, path, request/response shape)
- [ ] Database schema changes specified (new tables, columns, enums, relations)
- [ ] Validation rules described (required fields, formats, constraints)
- [ ] Auth/ownership rules clear (who can access/modify what)
- [ ] Edge cases covered (duplicates, conflicts, empty states, errors)

### Frontend
- [ ] UI layout described or mockup referenced
- [ ] User interactions defined (tap, swipe, long-press, etc.)
- [ ] Navigation flow clear (which page leads where, modals vs pages)
- [ ] Loading/error/empty states addressed
- [ ] i18n keys needed (both en/fr translations)
- [ ] Platform considerations (iOS/Android differences)

### 3D / Visual
- [ ] Camera behavior specified (position, animation, transitions)
- [ ] Object interactions defined (click, hover, select)
- [ ] Performance constraints mentioned (LOD, texture sizes, draw calls)
- [ ] Lighting/shading requirements

### Integration
- [ ] How this feature connects to existing features
- [ ] Data flow between frontend and backend
- [ ] Impact on existing API contracts or DB schema

## Question Priority

Ask questions in this order of importance:
1. **Blockers** — Cannot implement without this info (e.g., missing endpoint shape)
2. **Ambiguities** — Multiple valid interpretations (e.g., "a nice animation" — what kind?)
3. **Assumptions** — Reasonable defaults exist but user might want something different
4. **Nice-to-haves** — Optional enhancements spotted during analysis

## Question Format

Group questions by topic. Max 4 questions per round (use AskUserQuestion tool). Provide suggested defaults when possible so user can quickly confirm.
