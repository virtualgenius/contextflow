import * as Y from 'yjs'

export function renameProjectMutation(ydoc: Y.Doc, name: string): void {
  const yProject = ydoc.getMap('project')
  yProject.set('name', name)
}
