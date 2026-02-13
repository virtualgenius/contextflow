import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlowStageInspector } from '../FlowStageInspector'
import { useEditorStore } from '../../../model/store'
import type { Project } from '../../../model/types'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn() }),
}))

const mockUpdateFlowStage = vi.fn()
const mockDeleteFlowStage = vi.fn()
const mockSetSelectedStage = vi.fn()

function makeProject(): Project {
  return {
    id: 'proj-1',
    name: 'Test',
    contexts: [],
    relationships: [],
    repos: [],
    teams: [],
    groups: [],
    people: [],
    viewConfig: {
      flowStages: [
        { name: 'Discovery', position: 20, description: 'Finding products' },
        { name: 'Purchase', position: 60 },
      ],
    },
    users: [{ id: 'u-1', name: 'Shopper', position: 15 }],
    userNeeds: [{ id: 'n-1', name: 'Browse', position: 18 }],
  } as unknown as Project
}

describe('FlowStageInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useEditorStore).mockImplementation((selector) => {
      const state = {
        updateFlowStage: mockUpdateFlowStage,
        deleteFlowStage: mockDeleteFlowStage,
        setSelectedStage: mockSetSelectedStage,
      }
      return selector(state as never)
    })
  })

  it('renders not-found when stageIndex is out of bounds', () => {
    render(<FlowStageInspector project={makeProject()} stageIndex={99} />)
    expect(screen.getByText('Stage not found.')).toBeInTheDocument()
  })

  it('renders stage name', () => {
    render(<FlowStageInspector project={makeProject()} stageIndex={0} />)
    expect(screen.getByDisplayValue('Discovery')).toBeInTheDocument()
  })

  it('calls updateFlowStage on name change', () => {
    render(<FlowStageInspector project={makeProject()} stageIndex={0} />)
    fireEvent.change(screen.getByDisplayValue('Discovery'), { target: { value: 'Awareness' } })
    expect(mockUpdateFlowStage).toHaveBeenCalledWith(0, { name: 'Awareness' })
  })

  it('calls deleteFlowStage and clears selection on confirmed delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<FlowStageInspector project={makeProject()} stageIndex={0} />)
    fireEvent.click(screen.getByText('Delete Stage'))
    expect(mockDeleteFlowStage).toHaveBeenCalledWith(0)
    expect(mockSetSelectedStage).toHaveBeenCalledWith(null)
  })

  it('shows users in stage', () => {
    render(<FlowStageInspector project={makeProject()} stageIndex={0} />)
    expect(screen.getByText('Shopper')).toBeInTheDocument()
  })
})
