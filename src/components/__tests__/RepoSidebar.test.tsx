import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepoSidebar } from '../RepoSidebar'
import type { Repo, BoundedContext } from '../../model/types'

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    id: 'repo-1',
    name: 'orders-service',
    teamIds: [],
    contributors: [],
    ...overrides,
  }
}

function makeContext(overrides: Partial<BoundedContext> = {}): BoundedContext {
  return {
    id: 'ctx-1',
    name: 'Orders',
    positions: {
      flow: { x: 0 },
      strategic: { x: 0 },
      shared: { y: 0 },
    },
    ...overrides,
  } as BoundedContext
}

const noop = vi.fn()

describe('RepoSidebar', () => {
  describe('empty state', () => {
    it('shows an empty-state message and hint when there are no repos', () => {
      render(<RepoSidebar repos={[]} teams={[]} contexts={[]} onRepoAssign={noop} />)
      expect(screen.getByText('No repos yet')).toBeInTheDocument()
      expect(screen.getByText(/drag each one onto the context/i)).toBeInTheDocument()
    })

    it('does not show the empty state when repos exist', () => {
      render(<RepoSidebar repos={[makeRepo()]} teams={[]} contexts={[]} onRepoAssign={noop} />)
      expect(screen.queryByText('No repos yet')).not.toBeInTheDocument()
    })
  })

  describe('uniform cards (slice B)', () => {
    function makeTeam(overrides: Partial<import('../../model/types').Team> = {}) {
      return {
        id: 'team-1',
        name: 'Platform Squad',
        topologyType: 'platform' as const,
        ...overrides,
      }
    }

    it('shows an Unassigned status pill on unassigned repos', () => {
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByText('Unassigned')).toBeInTheDocument()
    })

    it('shows the context name as the status pill on assigned repos', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.queryByText('Unassigned')).not.toBeInTheDocument()
    })

    it('deletes an unassigned repo without confirmation', () => {
      const onDeleteRepo = vi.fn()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onDeleteRepo={onDeleteRepo}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Delete orders-service' }))
      expect(confirmSpy).not.toHaveBeenCalled()
      expect(onDeleteRepo).toHaveBeenCalledWith('repo-1')
      confirmSpy.mockRestore()
    })

    it('confirms before deleting an assigned repo', () => {
      const onDeleteRepo = vi.fn()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
          onDeleteRepo={onDeleteRepo}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Delete orders-service' }))
      expect(confirmSpy).toHaveBeenCalled()
      expect(onDeleteRepo).not.toHaveBeenCalled()
      confirmSpy.mockRestore()
    })

    it('does not select/assign when clicking delete', () => {
      const onDeleteRepo = vi.fn()
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onDeleteRepo={onDeleteRepo}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Delete orders-service' }))
      expect(onDeleteRepo).toHaveBeenCalledWith('repo-1')
    })

    it('renders team ownership badges without a native title attribute', () => {
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', teamIds: ['team-1'] })]}
          teams={[makeTeam()]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const badge = screen.getByText('Platform Squad')
      expect(badge).not.toHaveAttribute('title')
    })
  })

  describe('selection (slice C1)', () => {
    it('calls onSelectRepo when clicking an unassigned repo card', () => {
      const onSelectRepo = vi.fn()
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onSelectRepo={onSelectRepo}
        />
      )
      fireEvent.click(screen.getByText('orders-service'))
      expect(onSelectRepo).toHaveBeenCalledWith('repo-1')
    })

    it('calls onSelectRepo when clicking an assigned repo card', () => {
      const onSelectRepo = vi.fn()
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
          onSelectRepo={onSelectRepo}
        />
      )
      fireEvent.click(screen.getByText('orders-service'))
      expect(onSelectRepo).toHaveBeenCalledWith('repo-1')
    })

    it('shows a selected ring on the selected repo card', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          selectedRepoId="repo-1"
        />
      )
      expect(screen.getByTestId('repo-card-repo-1').className).toContain('ring-blue')
      expect(screen.getByTestId('repo-card-repo-2').className).not.toContain('ring-blue')
    })
  })

  describe('add repo', () => {
    it('shows an Add repo input and button', () => {
      render(<RepoSidebar repos={[]} teams={[]} contexts={[]} onRepoAssign={noop} />)
      expect(screen.getByPlaceholderText('Add repo...')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('calls onAddRepo when typing a name and pressing Enter', () => {
      const onAddRepo = vi.fn()
      render(
        <RepoSidebar
          repos={[]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onAddRepo={onAddRepo}
        />
      )
      const input = screen.getByPlaceholderText('Add repo...')
      fireEvent.change(input, { target: { value: 'new-service' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onAddRepo).toHaveBeenCalledWith('new-service')
    })

    it('calls onAddRepo when clicking Add', () => {
      const onAddRepo = vi.fn()
      render(
        <RepoSidebar
          repos={[]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onAddRepo={onAddRepo}
        />
      )
      const input = screen.getByPlaceholderText('Add repo...')
      fireEvent.change(input, { target: { value: 'new-service' } })
      fireEvent.click(screen.getByText('Add'))
      expect(onAddRepo).toHaveBeenCalledWith('new-service')
    })

    it('clears the input after adding', () => {
      render(
        <RepoSidebar repos={[]} teams={[]} contexts={[]} onRepoAssign={noop} onAddRepo={vi.fn()} />
      )
      const input = screen.getByPlaceholderText('Add repo...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'new-service' } })
      fireEvent.click(screen.getByText('Add'))
      expect(input.value).toBe('')
    })

    it('does not call onAddRepo with an empty/whitespace name', () => {
      const onAddRepo = vi.fn()
      render(
        <RepoSidebar
          repos={[]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
          onAddRepo={onAddRepo}
        />
      )
      const input = screen.getByPlaceholderText('Add repo...')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onAddRepo).not.toHaveBeenCalled()
    })
  })

  describe('rendering', () => {
    it('renders repo names', () => {
      render(
        <RepoSidebar
          repos={[makeRepo(), makeRepo({ id: 'repo-2', name: 'payments-api' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('payments-api')).toBeInTheDocument()
    })
  })

  describe('search filtering', () => {
    it('shows search input when more than 1 repo', () => {
      render(
        <RepoSidebar
          repos={[makeRepo(), makeRepo({ id: 'repo-2', name: 'payments-api' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByPlaceholderText('Filter repos...')).toBeInTheDocument()
    })

    it('does not show search input when only 1 repo', () => {
      render(<RepoSidebar repos={[makeRepo()]} teams={[]} contexts={[]} onRepoAssign={noop} />)
      expect(screen.queryByPlaceholderText('Filter repos...')).not.toBeInTheDocument()
    })

    it('does not show search input when no repos', () => {
      render(<RepoSidebar repos={[]} teams={[]} contexts={[]} onRepoAssign={noop} />)
      expect(screen.queryByPlaceholderText('Filter repos...')).not.toBeInTheDocument()
    })

    it('filters repos by name as user types', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
            makeRepo({ id: 'repo-3', name: 'order-events' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'order' } })

      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('order-events')).toBeInTheDocument()
      expect(screen.queryByText('payments-api')).not.toBeInTheDocument()
    })

    it('filters case-insensitively', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'Orders-Service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'ORDERS' } })

      expect(screen.getByText('Orders-Service')).toBeInTheDocument()
      expect(screen.queryByText('payments-api')).not.toBeInTheDocument()
    })

    it('shows result count when filtering', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
            makeRepo({ id: 'repo-3', name: 'order-events' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'order' } })

      expect(screen.getByText('2 of 3 repos')).toBeInTheDocument()
    })

    it('shows empty state when no repos match', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'xyz' } })

      expect(screen.getByText('No repos match your search')).toBeInTheDocument()
    })

    it('clears search when clicking X button', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'order' } })

      expect(screen.queryByText('payments-api')).not.toBeInTheDocument()

      // Click the clear button
      const clearButton = screen.getByRole('button', { name: /clear/i })
      fireEvent.click(clearButton)

      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('payments-api')).toBeInTheDocument()
    })

    it('shows all repos when search is empty', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'order' } })
      fireEvent.change(input, { target: { value: '' } })

      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('payments-api')).toBeInTheDocument()
    })
  })

  describe('assigned repos', () => {
    it('shows assigned repos with their context name', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('Orders')).toBeInTheDocument()
    })

    it('assigned repos are not draggable', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      const card = screen.getByTestId('repo-card-repo-1')
      expect(card).not.toHaveAttribute('draggable', 'true')
    })

    it('unassigned repos remain draggable', () => {
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const card = screen.getByTestId('repo-card-repo-1')
      expect(card).toHaveAttribute('draggable', 'true')
    })

    it('shows unassigned repos before assigned repos', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'assigned-repo', contextId: 'ctx-1' }),
            makeRepo({ id: 'repo-2', name: 'unassigned-repo' }),
          ]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      const cards = screen.getAllByTestId(/^repo-card-/)
      expect(cards[0]).toHaveAttribute('data-testid', 'repo-card-repo-2')
      expect(cards[1]).toHaveAttribute('data-testid', 'repo-card-repo-1')
    })

    it('shows section headers when both assigned and unassigned repos exist', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'assigned-repo', contextId: 'ctx-1' }),
            makeRepo({ id: 'repo-2', name: 'unassigned-repo' }),
          ]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      expect(screen.getByText('Ready to assign')).toBeInTheDocument()
      expect(screen.getByText('Assigned')).toBeInTheDocument()
    })

    it('does not show section headers when all repos are unassigned', () => {
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'repo-a' }),
            makeRepo({ id: 'repo-2', name: 'repo-b' }),
          ]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      expect(screen.queryByText('Ready to assign')).not.toBeInTheDocument()
      expect(screen.queryByText('Assigned')).not.toBeInTheDocument()
    })

    it('shows drag hint tooltip on unassigned repo cards', () => {
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const card = screen.getByTestId('repo-card-repo-1')
      fireEvent.mouseEnter(card)
      expect(screen.getByText('Drag onto a context to assign')).toBeInTheDocument()
    })

    it('does not show drag hint tooltip on assigned repo cards', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' })]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      const card = screen.getByTestId('repo-card-repo-1')
      fireEvent.mouseEnter(card)
      expect(screen.queryByText('Drag onto a context to assign')).not.toBeInTheDocument()
    })

    it('treats repo with contextId pointing to deleted context as unassigned', () => {
      render(
        <RepoSidebar
          repos={[makeRepo({ id: 'repo-1', name: 'orphan-repo', contextId: 'deleted-ctx' })]}
          teams={[]}
          contexts={[]}
          onRepoAssign={noop}
        />
      )
      const card = screen.getByTestId('repo-card-repo-1')
      expect(card).toHaveAttribute('draggable', 'true')
      expect(screen.queryByText('deleted-ctx')).not.toBeInTheDocument()
    })

    it('search filters across both assigned and unassigned repos', () => {
      const contexts = [makeContext({ id: 'ctx-1', name: 'Orders' })]
      render(
        <RepoSidebar
          repos={[
            makeRepo({ id: 'repo-1', name: 'orders-service', contextId: 'ctx-1' }),
            makeRepo({ id: 'repo-2', name: 'payments-api' }),
            makeRepo({ id: 'repo-3', name: 'order-events' }),
          ]}
          teams={[]}
          contexts={contexts}
          onRepoAssign={noop}
        />
      )
      const input = screen.getByPlaceholderText('Filter repos...')
      fireEvent.change(input, { target: { value: 'order' } })

      expect(screen.getByText('orders-service')).toBeInTheDocument()
      expect(screen.getByText('order-events')).toBeInTheDocument()
      expect(screen.queryByText('payments-api')).not.toBeInTheDocument()
    })
  })
})
