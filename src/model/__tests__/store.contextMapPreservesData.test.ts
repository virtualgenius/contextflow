import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../store'
import { initializeCollabMode, destroyCollabMode } from '../sync/useCollabMode'
import type { Project } from '../types'

function activeProject(): Project {
  const state = useEditorStore.getState()
  return state.projects[state.activeProjectId!]
}

describe('Context Map preserves value-stream data set in other views', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
    const state = useEditorStore.getState()
    const project = state.projects[state.activeProjectId!]
    const onProjectChange = (updatedProject: Project): void => {
      useEditorStore.setState((s) => ({
        projects: { ...s.projects, [updatedProject.id]: updatedProject },
      }))
    }
    initializeCollabMode(project, { onProjectChange })
    useEditorStore.getState().setViewMode('flow')
  })

  afterEach(() => {
    destroyCollabMode()
  })

  it('keeps users, needs, and their wiring intact across a Context Map visit and back', () => {
    const store = useEditorStore.getState()
    const contextId = activeProject().contexts[0].id

    store.addUser('Shopper')
    const userId = activeProject().users.find((u) => u.name === 'Shopper')!.id
    const needId = store.addUserNeed('Buy quickly')!
    const userNeedConnectionId = store.createUserNeedConnection(userId, needId)!
    const needContextConnectionId = store.createNeedContextConnection(needId, contextId)!

    const before = activeProject()
    const userCount = before.users.length
    const needCount = before.userNeeds.length
    const userNeedConnCount = before.userNeedConnections.length
    const needContextConnCount = before.needContextConnections.length

    useEditorStore.getState().setViewMode('context-map')

    // Data is preserved while in Context Map (just not rendered/editable here).
    const inContextMap = activeProject()
    expect(inContextMap.users).toHaveLength(userCount)
    expect(inContextMap.userNeeds).toHaveLength(needCount)
    expect(inContextMap.userNeedConnections).toHaveLength(userNeedConnCount)
    expect(inContextMap.needContextConnections).toHaveLength(needContextConnCount)

    useEditorStore.getState().setViewMode('flow')

    // Returning to Value Stream finds every entity and connection intact.
    const after = activeProject()
    expect(after.users.find((u) => u.id === userId)).toBeDefined()
    expect(after.userNeeds.find((n) => n.id === needId)).toBeDefined()
    expect(after.userNeedConnections.find((c) => c.id === userNeedConnectionId)).toBeDefined()
    expect(after.needContextConnections.find((c) => c.id === needContextConnectionId)).toBeDefined()
  })
})
