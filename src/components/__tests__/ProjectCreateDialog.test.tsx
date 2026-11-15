import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProjectCreateDialog } from '../ProjectCreateDialog'

describe('ProjectCreateDialog', () => {
  function renderDialog() {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ProjectCreateDialog onConfirm={onConfirm} onCancel={onCancel} />)
    return { onConfirm, onCancel }
  }

  const nameInput = () => screen.getByPlaceholderText('e.g., My Application')
  const createButton = () => screen.getByRole('button', { name: 'Create Project' })

  it('disables Create Project while the name is empty or whitespace', () => {
    renderDialog()
    expect(createButton()).toBeDisabled()
    fireEvent.change(nameInput(), { target: { value: '   ' } })
    expect(createButton()).toBeDisabled()
  })

  it('calls onConfirm with the trimmed name', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(nameInput(), { target: { value: '  Payments  ' } })
    fireEvent.click(createButton())
    expect(onConfirm).toHaveBeenCalledWith('Payments')
  })

  it('calls onConfirm when the form is submitted', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(nameInput(), { target: { value: 'Payments' } })
    fireEvent.submit(nameInput())
    expect(onConfirm).toHaveBeenCalledWith('Payments')
  })

  it('does not call onConfirm when submitted with a blank name', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(nameInput(), { target: { value: '   ' } })
    fireEvent.submit(nameInput())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const { onConfirm, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when the close (X) button is clicked', () => {
    const { onCancel } = renderDialog()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
