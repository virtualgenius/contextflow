import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SharedKernelConfirmDialog } from '../SharedKernelConfirmDialog'

describe('SharedKernelConfirmDialog', () => {
  function renderDialog(overrides: Partial<Parameters<typeof SharedKernelConfirmDialog>[0]> = {}) {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <SharedKernelConfirmDialog
        draggedContextName="Orders"
        otherContextName="Billing"
        existingPatternLabel="Customer-Supplier"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...overrides}
      />
    )
    return { onConfirm, onCancel }
  }

  it('shows the two context names and the existing pattern label', () => {
    renderDialog()
    expect(screen.getByText('Orders')).toBeTruthy()
    expect(screen.getByText('Billing')).toBeTruthy()
    expect(screen.getByText('Customer-Supplier')).toBeTruthy()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const { onConfirm } = renderDialog()
    fireEvent.click(screen.getByText('Convert to Shared Kernel'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when the close (X) button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
