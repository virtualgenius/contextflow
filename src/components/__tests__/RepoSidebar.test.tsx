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
