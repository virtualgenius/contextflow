import { describe, it, expect } from 'vitest';
import { projectToYDoc, yDocToProject } from '../projectSync';
import { renameProjectMutation } from '../projectMutations';
import type { Project } from '../../types';

function createTestProject(): Project {
  return {
    id: 'test-project',
    name: 'Test Project',
    contexts: [],
    relationships: [],
    groups: [],
    repos: [],
    people: [],
    teams: [],
    users: [],
    userNeeds: [],
    userNeedConnections: [],
    needContextConnections: [],
    viewConfig: { flowStages: [] },
  };
}

describe('projectMutations', () => {
  describe('renameProjectMutation', () => {
    it('should update the project name in Y.Doc', () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);

      renameProjectMutation(ydoc, 'New Name');

      const result = yDocToProject(ydoc);
      expect(result.name).toBe('New Name');
    });

    it('should preserve other project fields', () => {
      const project = createTestProject();
      project.contexts = [{
        id: 'ctx-1',
        name: 'Context One',
        evolutionStage: 'custom-built',
        positions: {
          flow: { x: 100 },
          strategic: { x: 200 },
          distillation: { x: 300, y: 300 },
          shared: { y: 100 },
        },
      }];
      const ydoc = projectToYDoc(project);

      renameProjectMutation(ydoc, 'Renamed');

      const result = yDocToProject(ydoc);
      expect(result.name).toBe('Renamed');
      expect(result.id).toBe('test-project');
      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].name).toBe('Context One');
    });

    it('should be undoable via CollabUndoManager', async () => {
      const project = createTestProject();
      const ydoc = projectToYDoc(project);
      const { createUndoManager } = await import('../undoManager');
      const undoManager = createUndoManager(ydoc);

      renameProjectMutation(ydoc, 'Renamed');
      expect(yDocToProject(ydoc).name).toBe('Renamed');

      undoManager.undo();
      expect(yDocToProject(ydoc).name).toBe('Test Project');
    });
  });
});
