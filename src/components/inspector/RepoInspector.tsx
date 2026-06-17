import React from 'react'
import { Trash2 } from 'lucide-react'
import { useEditorStore } from '../../model/store'
import type { Project } from '../../model/types'
import { INPUT_TITLE_CLASS, InspectorHeader, Section } from './inspectorShared'

export function RepoInspector({ project, repoId }: { project: Project; repoId: string }) {
  const updateRepo = useEditorStore((s) => s.updateRepo)
  const deleteRepo = useEditorStore((s) => s.deleteRepo)

  const repo = project.repos?.find((r) => r.id === repoId)
  if (!repo) {
    return <div className="text-neutral-500 dark:text-neutral-400">Repository not found.</div>
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <InspectorHeader>
        <input
          type="text"
          value={repo.name}
          onChange={(e) => updateRepo(repo.id, { name: e.target.value })}
          className={INPUT_TITLE_CLASS}
        />
      </InspectorHeader>

      {/* Remote URL */}
      <Section label="Remote URL">
        <input
          type="text"
          value={repo.remoteUrl || ''}
          onChange={(e) => updateRepo(repo.id, { remoteUrl: e.target.value })}
          placeholder="github.com/org/repo"
          className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-neutral-500"
        />
      </Section>

      {/* Delete Repository button */}
      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
        <button
          onClick={() => deleteRepo(repo.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 size={14} />
          Delete repository
        </button>
      </div>
    </div>
  )
}
