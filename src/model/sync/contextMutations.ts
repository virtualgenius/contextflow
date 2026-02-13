import * as Y from 'yjs';
import type { BoundedContext, Issue, IssueSeverity } from '../types';
import { populateContextYMap } from './contextSync';

export function addContextMutation(ydoc: Y.Doc, context: BoundedContext): void {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const yContext = new Y.Map<unknown>();
  populateContextYMap(yContext, context);
  yContexts.push([yContext]);
}

export function updateContextMutation(
  ydoc: Y.Doc,
  contextId: string,
  updates: Partial<BoundedContext>
): void {
  ydoc.transact(() => {
    const yContext = findContextById(ydoc, contextId);
    if (!yContext) return;

    applyScalarUpdates(yContext, updates);
    applyCodeSizeUpdate(yContext, updates);
  });
}

export function deleteContextMutation(ydoc: Y.Doc, contextId: string): void {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const index = findContextIndex(yContexts, contextId);
  if (index === -1) return;

  ydoc.transact(() => {
    cascadeDeleteRelationships(yProject, contextId);
    cascadeClearRepoContextIds(yProject, contextId);
    cascadeRemoveFromGroups(yProject, contextId);
    cascadeDeleteNeedContextConnections(yProject, contextId);
    cascadeRemoveFromTemporalKeyframes(yProject, contextId);
    yContexts.delete(index);
  });
}

export function updateContextPositionMutation(
  ydoc: Y.Doc,
  contextId: string,
  positions: BoundedContext['positions']
): void {
  ydoc.transact(() => {
    const yContext = findContextById(ydoc, contextId);
    if (!yContext) return;

    const yPositions = yContext.get('positions') as Y.Map<Y.Map<unknown>>;

    const yFlow = yPositions.get('flow') as Y.Map<number>;
    yFlow.set('x', positions.flow.x);

    const yStrategic = yPositions.get('strategic') as Y.Map<number>;
    yStrategic.set('x', positions.strategic.x);

    const yDistillation = yPositions.get('distillation') as Y.Map<number>;
    yDistillation.set('x', positions.distillation.x);
    yDistillation.set('y', positions.distillation.y);

    const yShared = yPositions.get('shared') as Y.Map<number>;
    yShared.set('y', positions.shared.y);
  });
}

function findContextById(ydoc: Y.Doc, contextId: string): Y.Map<unknown> | null {
  const yProject = ydoc.getMap('project');
  const yContexts = yProject.get('contexts') as Y.Array<Y.Map<unknown>>;

  const index = findContextIndex(yContexts, contextId);
  if (index === -1) return null;

  return yContexts.get(index);
}

function findContextIndex(yContexts: Y.Array<Y.Map<unknown>>, contextId: string): number {
  for (let i = 0; i < yContexts.length; i++) {
    const yContext = yContexts.get(i);
    if (yContext.get('id') === contextId) {
      return i;
    }
  }
  return -1;
}

function applyScalarUpdates(yContext: Y.Map<unknown>, updates: Partial<BoundedContext>): void {
  const scalarFields: (keyof BoundedContext)[] = [
    'name',
    'purpose',
    'strategicClassification',
    'ownership',
    'boundaryIntegrity',
    'boundaryNotes',
    'evolutionStage',
    'isLegacy',
    'notes',
    'teamId',
  ];

  for (const field of scalarFields) {
    if (field in updates) {
      const value = updates[field];
      yContext.set(field, value ?? null);
    }
  }
}

function applyCodeSizeUpdate(yContext: Y.Map<unknown>, updates: Partial<BoundedContext>): void {
  if (!('codeSize' in updates)) return;

  const codeSize = updates.codeSize;
  if (!codeSize) {
    yContext.set('codeSize', null);
    return;
  }

  const yCodeSize = new Y.Map<unknown>();
  yCodeSize.set('loc', codeSize.loc ?? null);
  yCodeSize.set('bucket', codeSize.bucket ?? null);
  yContext.set('codeSize', yCodeSize);
}

function cascadeDeleteRelationships(yProject: Y.Map<unknown>, contextId: string): void {
  const yRels = yProject.get('relationships') as Y.Array<Y.Map<unknown>>;
  for (let i = yRels.length - 1; i >= 0; i--) {
    const yRel = yRels.get(i);
    if (yRel.get('fromContextId') === contextId || yRel.get('toContextId') === contextId) {
      yRels.delete(i);
    }
  }
}

function cascadeClearRepoContextIds(yProject: Y.Map<unknown>, contextId: string): void {
  const yRepos = yProject.get('repos') as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yRepos.length; i++) {
    const yRepo = yRepos.get(i);
    if (yRepo.get('contextId') === contextId) {
      yRepo.set('contextId', null);
    }
  }
}

function cascadeRemoveFromGroups(yProject: Y.Map<unknown>, contextId: string): void {
  const yGroups = yProject.get('groups') as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yGroups.length; i++) {
    const yContextIds = yGroups.get(i).get('contextIds') as Y.Array<string>;
    for (let j = yContextIds.length - 1; j >= 0; j--) {
      if (yContextIds.get(j) === contextId) {
        yContextIds.delete(j);
      }
    }
  }
}

function cascadeDeleteNeedContextConnections(yProject: Y.Map<unknown>, contextId: string): void {
  const yConns = yProject.get('needContextConnections') as Y.Array<Y.Map<unknown>>;
  for (let i = yConns.length - 1; i >= 0; i--) {
    if (yConns.get(i).get('contextId') === contextId) {
      yConns.delete(i);
    }
  }
}

function cascadeRemoveFromTemporalKeyframes(yProject: Y.Map<unknown>, contextId: string): void {
  const yTemporal = yProject.get('temporal');
  if (yTemporal === null) return;

  const yKeyframes = (yTemporal as Y.Map<unknown>).get('keyframes') as Y.Array<Y.Map<unknown>>;
  for (let i = 0; i < yKeyframes.length; i++) {
    const yKeyframe = yKeyframes.get(i);

    const yPositions = yKeyframe.get('positions') as Y.Map<Y.Map<unknown>>;
    yPositions.delete(contextId);

    const yActiveIds = yKeyframe.get('activeContextIds') as Y.Array<string>;
    for (let j = yActiveIds.length - 1; j >= 0; j--) {
      if (yActiveIds.get(j) === contextId) {
        yActiveIds.delete(j);
      }
    }
  }
}

export function addContextIssueMutation(
  ydoc: Y.Doc,
  contextId: string,
  title: string,
  severity: IssueSeverity = 'warning'
): Issue {
  const newIssue: Issue = {
    id: `issue-${Date.now()}`,
    title,
    severity,
  };

  const yContext = findContextById(ydoc, contextId);
  if (!yContext) return newIssue;

  ydoc.transact(() => {
    let yIssues = yContext.get('issues') as Y.Array<Y.Map<unknown>> | null;
    if (!yIssues) {
      yIssues = new Y.Array<Y.Map<unknown>>();
      yContext.set('issues', yIssues);
    }

    const yIssue = new Y.Map<unknown>();
    yIssue.set('id', newIssue.id);
    yIssue.set('title', newIssue.title);
    yIssue.set('description', null);
    yIssue.set('severity', newIssue.severity);
    yIssues.push([yIssue]);
  });

  return newIssue;
}

export function updateContextIssueMutation(
  ydoc: Y.Doc,
  contextId: string,
  issueId: string,
  updates: Partial<Issue>
): void {
  const yContext = findContextById(ydoc, contextId);
  if (!yContext) return;

  const yIssues = yContext.get('issues') as Y.Array<Y.Map<unknown>> | null;
  if (!yIssues) return;

  ydoc.transact(() => {
    for (let i = 0; i < yIssues.length; i++) {
      const yIssue = yIssues.get(i);
      if (yIssue.get('id') === issueId) {
        if ('title' in updates) yIssue.set('title', updates.title ?? null);
        if ('description' in updates) yIssue.set('description', updates.description ?? null);
        if ('severity' in updates) yIssue.set('severity', updates.severity ?? null);
        break;
      }
    }
  });
}

export function deleteContextIssueMutation(
  ydoc: Y.Doc,
  contextId: string,
  issueId: string
): void {
  const yContext = findContextById(ydoc, contextId);
  if (!yContext) return;

  const yIssues = yContext.get('issues') as Y.Array<Y.Map<unknown>> | null;
  if (!yIssues) return;

  ydoc.transact(() => {
    for (let i = yIssues.length - 1; i >= 0; i--) {
      if (yIssues.get(i).get('id') === issueId) {
        yIssues.delete(i);
        break;
      }
    }

    if (yIssues.length === 0) {
      yContext.set('issues', null);
    }
  });
}
