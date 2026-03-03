# Analytics Usage Guide

Practical guide for using the PostHog dashboard to track ContextFlow user behavior.

> **Note:** ContextFlow migrated from Simple Analytics to PostHog in Feb 2026 for richer product analytics (funnels, retention, feature adoption). All existing events are preserved; they now flow through `posthog.capture()`. See [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md#posthog-migration-2026-02) for migration details.

## The Core Issue

Your analytics plan has all 5 slices implemented (Product Validation, Feature Adoption, Onboarding, Power Users, View-Specific Features), tracking ~60+ different event types with rich metadata.

**Solution:** PostHog's built-in funnels, retention charts, and feature flags make it easier to analyze these events directly. Focus on a few key dashboards for daily monitoring.

---

## Recommended Starter Reports

### Report 1: New User Funnel (FTUE Success)
**Goal:** Track first-time user experience milestones

**Events to filter:**
- `sample_project_loaded`
- `first_context_added`
- `first_relationship_added`
- `inspector_panel_opened`
- `view_switched`

**Metadata columns to add:**
- `time_since_load_seconds` (shows time to first action)
- `sample` (which sample did they load?)
- `project_origin` (sample/empty/imported)

**What this tells you:**
- What % of visitors add their first context (FTUE success rate)?
- How long does it take to get started?
- Which sample project is most popular?
- Are users exploring inspector details?

---

### Report 2: Exploration Patterns
**Goal:** Understand how new users explore the app

**Events to filter:**
- `sample_project_loaded`
- `sample_project_modified`
- `view_switched`
- `second_view_discovered`

**Metadata columns:**
- `sample` (ACME/cbioportal/elan/empty)
- `modification_type` (context_added/edited/relationship_added)
- `views_used` (array showing which views they tried)
- `to_view` (which view they switched to)

**What this tells you:**
- Do users start with samples or blank canvas?
- Do users modify samples or just view them?
- Which views do new users discover first?

---

### Report 3: Project Engagement Overview
**Goal:** See project-level activity (all users, including returning)

**Group by:** `project_id`

**Aggregate metrics to show:**
- `context_count` (average or max per project)
- `relationship_count`
- `group_count`
- `deployment` (hosted_demo/self_hosted/localhost)
- Count of events per project

**What this tells you:**
- Are users creating toy projects (few contexts) or real architecture?
- Which projects are "sample" vs "continued" vs "empty"?
- How many distinct projects exist?

---

### Report 4: Feature Adoption Snapshot
**Goal:** Which features are being used?

**Event name filter:**
- `feature_first_used`

**Metadata columns:**
- `feature` (relationships/groups/repo_assignment/external_contexts)
- `context_count` (project complexity when feature was first used)
- `project_id` (to count how many unique projects use each feature)

**What this tells you:**
- Which features are actually used?
- Is repo assignment valuable enough to keep?
- Are external contexts being used correctly?

---

## How to Track First-Time Users

**Question:** "Someone is trying contextflow.virtualgenius.com for the first time. How would I know, and what could I do to figure out how they are using the app?"

### Step 1: Filter to new visitors
**Filter:** `project_origin = 'sample'` (most first-timers load a sample)
**or** `Event name = 'sample_project_loaded'`

### Step 2: Track their journey
For a specific project, filter by `project_id` (e.g., `proj_009ldawd`), then:

1. **Sort by timestamp** to see chronological flow
2. **Look for FTUE milestones:**
   - Did `first_context_added` fire? (Success!)
   - Did `first_relationship_added` fire? (Understanding DDD patterns)
   - Did `second_view_discovered` fire? (Multi-view workflow adoption)

3. **Check metadata:**
   - `time_since_load_seconds` - How long before they took action?
   - `modification_type` - What did they do first?
   - `sample` - Which sample are they exploring?

### Step 3: Identify drop-off points
**Create a funnel:**
1. `sample_project_loaded` → baseline
2. `inspector_panel_opened` → engaged with details?
3. `sample_project_modified` → actively editing?
4. `first_context_added` → creating their own work?

Drop-off rate = (step N count / step 1 count) shows where users get stuck.

---

## Simplifying the Field List

The "Add a column" dropdown is overwhelming because your analytics plan tracks detailed metadata for export analysis. Here's how to focus:

### Fields you'll use most often (start here):
- `project_id` - Track individual projects
- `project_origin` - sample/empty/imported/continued
- `deployment` - hosted_demo/self_hosted/localhost
- `app_version` - Track version usage
- `context_count` - Project complexity
- `relationship_count` - Feature adoption signal
- `sample` - Which sample loaded
- `time_since_load_seconds` - FTUE timing

### Fields for specific questions only:
- `actor_count`, `need_count`, `keyframe_count` - Only when analyzing those features
- `repo_assignment_count`, `person_count`, `team_count` - Only for repo/team adoption questions
- `from_view`, `to_view` - Only for view-switching analysis

---

## See Also

- [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) - Implementation strategy and event catalog
- PostHog Dashboard - Main analytics interface
