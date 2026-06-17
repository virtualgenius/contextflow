# Analytics Event Reference

The complete catalog of analytics events ContextFlow emits through PostHog. This
is the **source of truth** for event coverage: `scripts/check-release.mjs` fails
the release gate if `src/` fires an event that is not listed here, so adding a
new `trackEvent`/`trackPropertyChange` means adding a line below in the same change.

For dashboard/reporting guidance see [ANALYTICS_USAGE_GUIDE.md](ANALYTICS_USAGE_GUIDE.md);
for the original tracking strategy and metadata shapes see [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md).
Every event also carries global metadata (deployment, app version, project-complexity counts).

## Project lifecycle
- `project_created` - a new project was created
- `project_opened` - a project was opened
- `project_closed` - a project session ended (carries session duration)
- `project_renamed` - a project was renamed
- `project_deleted` - a project was deleted
- `project_exported` - a project was exported to file
- `project_imported` - a project was imported from file
- `import_conflict_resolved` - the user resolved a conflict during import
- `shared_project_opened` - a shared (collaborative) project was opened by link

## Collaboration and sharing
- `collab_connected` - the collaboration socket connected
- `collab_disconnected` - the collaboration socket disconnected
- `collab_reconnecting` - the collaboration socket is retrying
- `collab_offline` - the collaboration socket went offline
- `collab_error` - the collaboration socket errored
- `share_dialog_opened` - the Share Project dialog was opened
- `share_link_copied` - a share link was copied to the clipboard

## Contexts
- `context_added` - a bounded context was added
- `context_updated` - a context property changed (carries `properties_changed`)
- `context_deleted` - a context was deleted
- `context_added_to_group` - a context was added to a group
- `context_removed_from_group` - a context was removed from a group

## Relationships
- `relationship_added` - a relationship edge was created
- `relationship_updated` - a relationship property changed
- `relationship_deleted` - a relationship was deleted
- `relationship_direction_swapped` - upstream/downstream direction was swapped
- `relationship_converted_to_shared_kernel` - a relationship was converted to a shared kernel
- `shared_kernel_created_by_overlap` - a shared kernel formed from overlapping contexts
- `shared_kernel_separated_to_partnership` - a shared kernel was separated into a partnership

## Groups (capability clusters)
- `group_created` - a group was created
- `group_property_changed` - a group label/color/notes changed
- `group_deleted` - a group was deleted

## Issues
- `issue_added` - an issue was added to a context
- `issue_updated` - an issue was edited
- `issue_deleted` - an issue was removed

## Users and user needs (Strategic View)
- `user_added` - an actor/user was added
- `user_property_changed` - an actor property changed
- `user_deleted` - an actor was deleted
- `user_need_added` - a user need was added
- `user_need_property_changed` - a user need property changed
- `user_need_deleted` - a user need was deleted
- `user_need_connection_created` - an actor-to-need connection was created
- `user_need_connection_updated` - an actor-to-need connection changed
- `user_need_connection_deleted` - an actor-to-need connection was deleted
- `need_context_connection_created` - a need-to-context connection was created
- `need_context_connection_updated` - a need-to-context connection changed
- `need_context_connection_deleted` - a need-to-context connection was deleted

## Teams
- `team_added` - a team was created
- `team_updated` - a team property changed (e.g. topology, jira board)
- `team_deleted` - a team was deleted
- `team_assigned_to_context` - a team was assigned to a context
- `team_unassigned_from_context` - a team was unassigned from a context

## Repos
- `repo_added` - a repo was created (`source`: 'sidebar' | 'inspector')
- `repo_selected` - a repo card was clicked, opening the Repo inspector
- `repo_deleted` - a repo was deleted
- `repo_assigned_to_context` - a repo was mapped to a context
- `repo_unassigned` - a repo was detached from its context
- `repo_team_added` - an owning team was added to a repo
- `repo_team_removed` - an owning team was removed from a repo

## Teams and Repos sidebar
- `sidebar_tab_changed` - switched between the Teams and Repos tabs (`tab`)
- `sidebar_filter_changed` - changed a filter chip (`tab`, `value`)

## Focus lens
- `focus_entered` - a focus was started (`focus_kind`: team | context, `focus_depth`)
- `focus_depth_changed` - the focus neighborhood was widened/narrowed
- `focus_team_switched` - the user hopped to another team from the focus bar

## Flow stages (Value Stream View)
- `flow_stage_created` - a flow stage was added
- `flow_stage_moved` - a flow stage was repositioned
- `flow_stage_deleted` - a flow stage was removed

## Temporal evolution and keyframes
- `temporal_mode_toggled` - temporal mode was turned on/off
- `keyframe_created` - a keyframe was created
- `keyframe_selected` - a keyframe was selected
- `keyframe_deselected` - a keyframe was deselected
- `keyframe_deleted` - a keyframe was deleted
- `keyframe_context_position_changed` - a context was repositioned within a keyframe

## Views and preferences
- `view_switched` - the active view changed (`from_view`, `to_view`)
- `view_preference_changed` - a view toggle/preference changed

## Editing primitives
- `text_field_edited` - a text field changed (PII-safe char counts; see ANALYTICS_PLAN)
- `undo_used` - an undo was performed
- `redo_used` - a redo was performed

## Integrations
- `integration_toggled` - an integration (e.g. CodeCohesion) was enabled/disabled

## Help and onboarding
- `getting_started_guide_opened` - the getting-started guide was opened
- `keyboard_shortcuts_opened` - the keyboard shortcuts panel was opened
