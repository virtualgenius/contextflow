import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from '../../store'
import { initializeCollabMode, destroyCollabMode, isCollabModeActive } from '../useCollabMode'
import type { Project } from '../../types'

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Source',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 50 },
          strategic: { x: 50 },
          distillation: { x: 50, y: 50 },
          shared: { y: 50 },
        },
      },
    ],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
    temporal: { enabled: false, keyframes: [] },
  }
}

describe('position-aware context creation', () => {
  let testProject: Project

  beforeEach(() => {
    testProject = createTestProject()
    destroyCollabMode()
    useEditorStore.setState({
      activeProjectId: testProject.id,
      projects: { [testProject.id]: testProject },
      selectedContextId: null,
      undoStack: [],
      redoStack: [],
    })
    initializeCollabMode(testProject, {
      onProjectChange: (project: Project): void => {
        useEditorStore.setState((state) => ({
          projects: { ...state.projects, [project.id]: project },
        }))
      },
    })
  })

  afterEach(() => {
    destroyCollabMode()
  })

  function project(): Project {
    return useEditorStore.getState().projects[testProject.id]
  }

  describe('addContext with an explicit position', () => {
    it('places the context at the given flow position and selects it', () => {
      expect(isCollabModeActive()).toBe(true)

      const id = useEditorStore.getState().addContext('Placed', { x: 30, y: 70 })

      const created = project().contexts.find((c) => c.id === id)
      expect(created).toBeDefined()
      expect(created!.positions.flow.x).toBeCloseTo(30)
      expect(created!.positions.shared.y).toBeCloseTo(70)
      expect(useEditorStore.getState().selectedContextId).toBe(id)
    })

    it('still works without a position (algorithmic placement)', () => {
      const id = useEditorStore.getState().addContext('Auto')
      const created = project().contexts.find((c) => c.id === id)
      expect(created).toBeDefined()
      expect(created!.positions.flow.x).toBeGreaterThanOrEqual(0)
    })
  })

  describe('createRelatedContext', () => {
    it('up creates a new upstream context (source is from, new is to, no pattern) and selects it', () => {
      const newId = useEditorStore.getState().createRelatedContext('ctx-1', 'up', 'Upstream')

      const created = project().contexts.find((c) => c.id === newId)
      expect(created).toBeDefined()
      expect(created!.name).toBe('Upstream')
      expect(created!.positions.shared.y).toBeLessThan(50)

      const rel = project().relationships[0]
      expect(rel.fromContextId).toBe('ctx-1')
      expect(rel.toContextId).toBe(newId)
      expect(rel.pattern).toBeUndefined()

      expect(useEditorStore.getState().selectedContextId).toBe(newId)
    })

    it('down creates a new downstream context (new is from, source is to, no pattern)', () => {
      const newId = useEditorStore.getState().createRelatedContext('ctx-1', 'down', 'Downstream')

      const rel = project().relationships[0]
      expect(rel.fromContextId).toBe(newId)
      expect(rel.toContextId).toBe('ctx-1')
      expect(rel.pattern).toBeUndefined()
      expect(project().contexts.find((c) => c.id === newId)!.positions.shared.y).toBeGreaterThan(50)
    })

    it('left stamps a partnership relationship', () => {
      const newId = useEditorStore.getState().createRelatedContext('ctx-1', 'left', 'Peer')
      const rel = project().relationships[0]
      expect(rel.fromContextId).toBe('ctx-1')
      expect(rel.toContextId).toBe(newId)
      expect(rel.pattern).toBe('partnership')
    })

    it('right stamps a shared-kernel relationship and overlaps the source', () => {
      const newId = useEditorStore.getState().createRelatedContext('ctx-1', 'right', 'Kernel')
      const rel = project().relationships[0]
      expect(rel.pattern).toBe('shared-kernel')
      const created = project().contexts.find((c) => c.id === newId)!
      const NODE_WIDTH_PERCENT = 8.5
      expect(Math.abs(created.positions.flow.x - 50)).toBeLessThan(NODE_WIDTH_PERCENT)
    })

    it('chains: the new context becomes selected so a second call spawns from it', () => {
      const firstId = useEditorStore.getState().createRelatedContext('ctx-1', 'up', 'First')
      expect(firstId).not.toBeNull()
      expect(useEditorStore.getState().selectedContextId).toBe(firstId)
      const secondId = useEditorStore.getState().createRelatedContext(firstId!, 'up', 'Second')

      expect(project().contexts).toHaveLength(3)
      expect(project().relationships).toHaveLength(2)
      const secondRel = project().relationships.find(
        (r) => r.fromContextId === firstId && r.toContextId === secondId
      )
      expect(secondRel).toBeDefined()
    })

    it('does nothing for an unknown source context', () => {
      const result = useEditorStore.getState().createRelatedContext('missing', 'up', 'Nope')
      expect(result).toBeNull()
      expect(project().contexts).toHaveLength(1)
      expect(project().relationships).toHaveLength(0)
    })
  })
})
