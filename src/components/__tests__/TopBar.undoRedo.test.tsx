import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import * as Y from 'yjs'
import { TopBar } from '../TopBar'
import { useEditorStore } from '../../model/store'
import {
  initializeCollabMode,
  destroyCollabMode,
  getCollabStore,
} from '../../model/sync/useCollabMode'
import type { Project, BoundedContext } from '../../model/types'

vi.mock('../../hooks/useUrlRouter', () => ({
  useUrlRouter: () => ({ route: 'home', navigate: vi.fn() }),
}))

// Stub heavy, network-dependent children; this test focuses on the undo/redo
// buttons reacting to real Yjs undo manager state.
vi.mock('../CloudStatusIndicator', () => ({
  CloudStatusIndicator: () => <div data-testid="cloud-status" />,
}))
vi.mock('../settings/SettingsPopover', () => ({
  SettingsPopover: () => <div data-testid="settings-popover" />,
}))

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [
      {
        id: 'ctx-1',
        name: 'Context One',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 100 },
          strategic: { x: 200 },
          distillation: { x: 300, y: 300 },
          shared: { y: 100 },
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
    viewConfig: {
      flowStages: [],
    },
    temporal: {
      enabled: false,
      keyframes: [],
    },
  }
}

const movedPositions: BoundedContext['positions'] = {
  flow: { x: 500 },
  strategic: { x: 600 },
  distillation: { x: 700, y: 800 },
  shared: { y: 900 },
}

// Mirrors the wiring in store.ts reconnectCollabForProject: project changes
// and undo-state changes both flow back into the Zustand store.
function wireCollabLikeProduction(project: Project): void {
  initializeCollabMode(project, {
    onProjectChange: (updated) =>
      useEditorStore.setState((s) => ({
        projects: { ...s.projects, [updated.id]: updated },
      })),
    onUndoStateChange: (undoState) => useEditorStore.setState(undoState),
  })
}

function activeContextFlowX(): number {
  const state = useEditorStore.getState()
  return state.projects['test-project'].contexts[0].positions.flow.x
}

function undoButton(): HTMLElement {
  return screen.getByLabelText('Undo')
}

function redoButton(): HTMLElement {
  return screen.getByLabelText('Redo')
}

function moveContext(): void {
  act(() => {
    useEditorStore.getState().updateContextPosition('ctx-1', movedPositions)
  })
}

describe('TopBar undo/redo buttons driven by Yjs undo manager', () => {
  beforeEach(() => {
    destroyCollabMode()
    const testProject = createTestProject()
    useEditorStore.setState({
      activeProjectId: testProject.id,
      projects: { [testProject.id]: testProject },
    })
    wireCollabLikeProduction(testProject)
  })

  afterEach(() => {
    destroyCollabMode()
  })

  it('disables both buttons on a freshly loaded project with no edits', () => {
    render(<TopBar />)

    expect(undoButton()).toBeDisabled()
    expect(redoButton()).toBeDisabled()
  })

  it('enables Undo and keeps Redo disabled after moving a context', () => {
    render(<TopBar />)

    moveContext()

    expect(undoButton()).toBeEnabled()
    expect(redoButton()).toBeDisabled()
  })

  it('clicking Undo reverts the move and enables Redo', () => {
    render(<TopBar />)
    moveContext()
    expect(activeContextFlowX()).toBe(500)

    fireEvent.click(undoButton())

    expect(activeContextFlowX()).toBe(100)
    expect(redoButton()).toBeEnabled()
    expect(undoButton()).toBeDisabled()
  })

  it('clicking Redo restores the move and re-enables Undo', () => {
    render(<TopBar />)
    moveContext()
    fireEvent.click(undoButton())
    expect(activeContextFlowX()).toBe(100)

    fireEvent.click(redoButton())

    expect(activeContextFlowX()).toBe(500)
    expect(undoButton()).toBeEnabled()
    expect(redoButton()).toBeDisabled()
  })

  it('keeps button state in sync with keyboard-driven undo/redo', () => {
    render(<TopBar />)
    moveContext()

    // CanvasArea's Cmd+Z / Cmd+Shift+Z handlers call the store actions directly.
    act(() => {
      useEditorStore.getState().undo()
    })
    expect(activeContextFlowX()).toBe(100)
    expect(undoButton()).toBeDisabled()
    expect(redoButton()).toBeEnabled()

    act(() => {
      useEditorStore.getState().redo()
    })
    expect(activeContextFlowX()).toBe(500)
    expect(undoButton()).toBeEnabled()
    expect(redoButton()).toBeDisabled()
  })

  it('does not enable Undo when a remote collaborator edits the project', () => {
    render(<TopBar />)

    const localDoc = getCollabStore()!.getYDoc()
    const remoteDoc = new Y.Doc()
    Y.applyUpdate(remoteDoc, Y.encodeStateAsUpdate(localDoc))

    act(() => {
      remoteDoc.transact(() => {
        remoteDoc.getMap('project').set('name', 'Renamed Remotely')
      }, 'remote-peer')
      const remoteUpdate = Y.encodeStateAsUpdate(remoteDoc, Y.encodeStateVector(localDoc))
      Y.applyUpdate(localDoc, remoteUpdate, 'remote-peer')
    })

    expect(useEditorStore.getState().projects['test-project'].name).toBe('Renamed Remotely')
    expect(undoButton()).toBeDisabled()
    expect(redoButton()).toBeDisabled()
  })
})
