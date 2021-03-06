// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { CommandRegistry } from '@lumino/commands';

import { Widget } from '@lumino/widgets';

import { ServiceManager } from '@jupyterlab/services';
import { PathExt, PageConfig } from '@jupyterlab/coreutils';

import {
  NotebookPanel,
  NotebookWidgetFactory,
  NotebookModelFactory
} from '@jupyterlab/notebook';

import { Completer, CompletionHandler } from '@jupyterlab/completer';

import { editorServices } from '@jupyterlab/codemirror';

import { DocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { NotebookComponent } from './component';
import { CompleterComponent } from '../components/completer';

import * as React from 'react';

interface NotebookPageProps {
  serviceManager: ServiceManager.IManager;
  notebookPath: string;
  rendermime: RenderMimeRegistry;
}

/**
 * Notebook application component
 */
export class NotebookPage extends React.Component<NotebookPageProps> {
  commands: CommandRegistry;
  nbWidget: NotebookPanel;
  completer: Completer;
  completionHandler: CompletionHandler;

  constructor(props: NotebookPageProps) {
    super(props);

    // Initialize the command registry with the bindings.
    this.commands = new CommandRegistry();
    let useCapture = true;

    // Setup the keydown listener for the document.
    document.addEventListener(
      'keydown',
      event => {
        this.commands.processKeydownEvent(event);
      },
      useCapture
    );

    let opener = {
      open: (widget: Widget) => {
        // Do nothing for sibling widgets for now.
      }
    };

    let docRegistry = new DocumentRegistry();
    let docManager = new DocumentManager({
      registry: docRegistry,
      manager: this.props.serviceManager,
      opener
    });
    let mFactory = new NotebookModelFactory({});
    let editorFactory = editorServices.factoryService.newInlineEditor;
    let contentFactory = new NotebookPanel.ContentFactory({ editorFactory });

    let wFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      canStartKernel: true,
      rendermime: this.props.rendermime,
      contentFactory,
      mimeTypeService: editorServices.mimeTypeService
    });
    docRegistry.addModelFactory(mFactory);
    docRegistry.addWidgetFactory(wFactory);

    this.nbWidget = docManager.open(this.props.notebookPath) as NotebookPanel;

    this.addCommands();
  }

  addCommands = () => {
    let commands = this.commands;

    commands.addCommand('switch:lab', {
      label: 'Open in JupyterLab',
      execute: () => {
        const labUrl =
          PageConfig.getBaseUrl() + 'lab/tree/' + this.props.notebookPath;
        window.location.href = labUrl;
      }
    });
    commands.addCommand('switch:classic', {
      label: 'Open in Classic Jupyter',
      execute: () => {
        const classicUrl =
          PageConfig.getBaseUrl() + 'tree/' + this.props.notebookPath;
        window.location.href = classicUrl;
      }
    });
    return commands;
  };

  commandOrder = ['notebook:download', '-', 'switch:lab', 'switch:classic'];

  render() {
    // FIXME: Better way of getting rid of extension?
    const notebookName = PathExt.basename(this.props.notebookPath).replace(
      '.ipynb',
      ''
    );
    console.log('notebook name:', notebookName);

    return [
        <NotebookComponent
          id="main-container"
          commands={this.commands}
          notebookWidget={this.nbWidget}
          notebookPath={this.props.notebookPath}
          contentsManager={this.props.serviceManager.contents}
        />,
      <CompleterComponent
        key="completer"
        commands={this.commands}
        notebookPanel={this.nbWidget}
      />
    ];
  }
}
