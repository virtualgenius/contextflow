import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepoSidebar } from '../RepoSidebar'
import type { Repo } from '../../model/types'

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    id: 'repo-1',
    name: 'orders-service',
    teamIds: [],
    contributors: [],
    ...overrides,
  }
}

const noop = vi.fn()

describe('RepoSidebar', () => {
  describe('rendering', () => {
    it('renders repo names', () => {
      render(
        <RepoSidebar
          repos={[makeRepo(), makeRepo({ id: 'repo-2', name: 'payments-api' })]}
          teams={[]}
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
          onRepoAssign={noop}
        />
      )
      expect(screen.getByPlaceholderText('Filter repos...')).toBeInTheDocument()
    })

    it('does not show search input when only 1 repo', () => {
      render(
        <RepoSidebar
          repos={[makeRepo()]}
          teams={[]}
          onRepoAssign={noop}
        />
      )
      expect(screen.queryByPlaceholderText('Filter repos...')).not.toBeInTheDocument()
    })

    it('does not show search input when no repos', () => {
      render(
        <RepoSidebar
          repos={[]}
          teams={[]}
          onRepoAssign={noop}
        />
      )
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
})
