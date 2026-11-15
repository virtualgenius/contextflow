import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectDeleteDialog } from '../ProjectDeleteDialog'

describe('ProjectDeleteDialog', () => {
  function renderDialog() {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ProjectDeleteDialog projectName="Payments" onConfirm={onConfirm} onCancel={onCancel} />)
    return { onConfirm, onCancel }
  }

  it('shows the project name', () => {
    renderDialog()
    expect(screen.getByText('"Payments"')).toBeInTheDocument()
  })

  it('calls onConfirm when Delete Project is clicked', () => {
    const { onConfirm, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Project' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const { onConfirm, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when the close (X) button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
