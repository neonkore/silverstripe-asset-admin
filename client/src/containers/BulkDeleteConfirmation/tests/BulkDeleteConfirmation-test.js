/* global jest, jasmine, describe, it, expect, beforeEach, Event */

import React from 'react';
import { Component } from '../BulkDeleteConfirmation';
import ShallowRenderer from 'react-test-renderer/shallow';

describe('BulkDeleteConfirmation', () => {
  const renderer = new ShallowRenderer();

  const FOLDER = 'folder';
  const FILE = 'file';

  const files = [
    { id: 1, title: 'A folder', type: FOLDER },
    { id: 2, title: 'Another folder', type: FOLDER },
    { id: 3, title: 'image.jpg', type: FILE },
    { id: 4, title: 'document.pdf', type: FILE },
  ];

  let props;

  beforeEach(() => {
    props = {
      loading: false,
      LoadingComponent: () => <p>Loading...</p>,
      transition: false,
      descendantFileCounts: {},
      onCancel: jest.fn(),
      onModalClose: jest.fn(),
      onConfirm: jest.fn(),
      archiveFiles: false
    };
  });

  it('Nothing in use - delete', () => {
    renderer.render(<Component {...props} files={files.slice(0, 2)} />);
    const { props: { isOpen, actions } } = renderer.getRenderOutput();

    expect(isOpen).toBe(true);
    expect(actions.length).toBe(2);
    expect(actions[0].label).toBe('Delete');
    expect(actions[1].label).toBe('Cancel');

    actions[0].handler();
    expect(props.onConfirm.mock.calls.length).toBe(1);
    expect(props.onCancel.mock.calls.length).toBe(0);
  });

  it('Nothing in use - archive', () => {
    renderer.render(<Component
      {...{
        ...props,
        archiveFiles: true
      }}
      files={files.slice(0, 2)}
    />);
    const { props: { actions } } = renderer.getRenderOutput();
    expect(actions[0].label).toBe('Archive');
  });

  it('Folder in use - delete', () => {
    renderer.render(<Component {...props} files={files} fileUsage={{ 1: 5 }} />);
    const { props: { isOpen, actions } } = renderer.getRenderOutput();

    expect(isOpen).toBe(true);
    expect(actions.length).toBe(2);
    expect(actions[0].label).toBe('Cancel');
    expect(actions[1].label).toBe('Delete');

    actions[0].handler();
    expect(props.onConfirm.mock.calls.length).toBe(0);
    expect(props.onCancel.mock.calls.length).toBe(1);
  });

  it('Folder in use - archive', () => {
    renderer.render(<Component
      {...{
        ...props,
        archiveFiles: true
      }}
      files={files}
      fileUsage={{ 1: 5 }}
    />);
    const { props: { actions } } = renderer.getRenderOutput();
    expect(actions[1].label).toBe('Archive');
  });

  it('Files in use - delete', () => {
    renderer.render(<Component {...props} files={files} fileUsage={{ 3: 5 }} />);
    const { props: { isOpen, actions } } = renderer.getRenderOutput();

    expect(isOpen).toBe(true);
    expect(actions.length).toBe(2);
    expect(actions[0].label).toBe('Cancel');
    expect(actions[1].label).toBe('Delete');

    actions[0].handler();
    expect(props.onConfirm.mock.calls.length).toBe(0);
    expect(props.onCancel.mock.calls.length).toBe(1);
  });

  it('Files in use - archive', () => {
    renderer.render(<Component
      {...{
        ...props,
        archiveFiles: true
      }}
      files={files}
      fileUsage={{ 3: 5 }}
    />);
    const { props: { actions } } = renderer.getRenderOutput();
    expect(actions[1].label).toBe('Archive');
  });
});
