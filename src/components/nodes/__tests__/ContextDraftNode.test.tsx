import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { NodeProps } from 'reactflow'
import { ContextDraftNode } from '../ContextDraftNode'
import { useEditorStore } from '../../../model/store'
import type { ContextDraft } from '../../../model/storeTypes'

vi.mock('../../../model/store', () => ({
  useEditorStore: Object.assign(vi.fn(), { setState: vi.fn(), getState: vi.fn() }),
}))

vi.mock('reactflow', () => ({}))

const actions = {
  addContext: vi.fn(),
  createRelatedContext: vi.fn(),
  addUser: vi.fn(),
  addUserNeed: vi.fn(),
  addFlowStage: vi.fn(),
  cancelContextDraft: vi.fn(),
}

function setup(draft: ContextDraft) {
  const state = { ...actions } as Record<string, unknown>
  vi.mocked(useEditorStore).mockImplementation((selector) => selector(state as never))
  const position = { x: 10, y: 20 }
  const props = { data: { draft, position } } as unknown as NodeProps
  return render(<ContextDraftNode {...props} />)
}

function typeAndEnter(value: string) {
  const input = screen.getByRole('textbox') as HTMLInputElement
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('ContextDraftNode commit routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('routes a user entity draft to addUser and closes', () => {
    setup({ kind: 'entity', entity: 'user' })
    expect((screen.getByRole('textbox') as HTMLInputElement).placeholder).toBe('User name...')
    typeAndEnter('Shopper')
    expect(actions.addUser).toHaveBeenCalledWith('Shopper')
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('routes a userNeed entity draft to addUserNeed and closes', () => {
    setup({ kind: 'entity', entity: 'userNeed' })
    expect((screen.getByRole('textbox') as HTMLInputElement).placeholder).toBe('User need name...')
    typeAndEnter('Browse catalog')
    expect(actions.addUserNeed).toHaveBeenCalledWith('Browse catalog')
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('routes a stage entity draft to addFlowStage and closes', () => {
    setup({ kind: 'entity', entity: 'stage' })
    expect((screen.getByRole('textbox') as HTMLInputElement).placeholder).toBe('Stage name...')
    typeAndEnter('Checkout')
    expect(actions.addFlowStage).toHaveBeenCalledWith('Checkout')
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('routes a context draft to addContext with placeholder Context name...', () => {
    setup({ kind: 'center' })
    expect((screen.getByRole('textbox') as HTMLInputElement).placeholder).toBe('Context name...')
    typeAndEnter('Orders')
    expect(actions.addContext).toHaveBeenCalledWith('Orders', { x: 10, y: 20 })
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('creates nothing on Escape', () => {
    setup({ kind: 'entity', entity: 'user' })
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Shopper' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(actions.addUser).not.toHaveBeenCalled()
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('creates nothing on blur with empty input', () => {
    setup({ kind: 'entity', entity: 'user' })
    const input = screen.getByRole('textbox')
    fireEvent.blur(input)
    expect(actions.addUser).not.toHaveBeenCalled()
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
  })

  it('keeps the stage field open with typed text and inline error when the commit throws', () => {
    actions.addFlowStage.mockImplementation(() => {
      throw new Error('Stage name must be unique')
    })
    setup({ kind: 'entity', entity: 'stage' })
    typeAndEnter('Checkout')

    expect(actions.cancelContextDraft).not.toHaveBeenCalled()
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Checkout')
    expect(screen.getByText('Stage name must be unique')).toBeInTheDocument()
  })

  it('creates the stage and closes once a unique name is resubmitted after a rejection', () => {
    let calls = 0
    actions.addFlowStage.mockImplementation(() => {
      calls += 1
      if (calls === 1) throw new Error('Stage name must be unique')
    })
    setup({ kind: 'entity', entity: 'stage' })
    typeAndEnter('Checkout')
    expect(screen.getByText('Stage name must be unique')).toBeInTheDocument()

    typeAndEnter('Fulfillment')
    expect(actions.addFlowStage).toHaveBeenLastCalledWith('Fulfillment')
    expect(actions.cancelContextDraft).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Stage name must be unique')).not.toBeInTheDocument()
  })
})
