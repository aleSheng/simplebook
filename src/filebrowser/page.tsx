// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { CommandRegistry } from '@lumino/commands';

import { DockPanel, Widget } from '@lumino/widgets';

import { ServiceManager, Contents } from '@jupyterlab/services';
import { PageConfig } from '@jupyterlab/coreutils';


import { FileBrowser, FileBrowserModel } from '@jupyterlab/filebrowser';

import { DocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import * as React from 'react';
import { FileBrowserComponent } from './component';

import '../../styles/filebrowser.css';
import { IChangedArgs } from '@jupyterlab/coreutils';

export interface FileBrowserPageProps {
  serviceManager: ServiceManager.IManager;
  startingPath: string;
}

export interface FileBrowserPageState {
  currentPath: string
}

/**
 * Notebook application component
 */
export class FileBrowserPage extends React.Component<FileBrowserPageProps, FileBrowserPageState> {
  fileBrowser: FileBrowser;
  widgets: Widget[] = [];
  activeWidget: Widget;
  dock: DockPanel;
  docManager: DocumentManager;
  commands: CommandRegistry;

  constructor(props: FileBrowserPageProps) {
    super(props);

    this.state = {
      currentPath: this.props.startingPath
    };

    const opener = {
      open: (widget: Widget) => {
        console.log(widget);
      }
    }
    const docRegistry = new DocumentRegistry();
    this.docManager = new DocumentManager({
      registry: docRegistry,
      manager: this.props.serviceManager,
      opener
    });

    const fbModel = new FileBrowserModel({
      manager: this.docManager,
    });
    fbModel.cd(this.state.currentPath).then(r => console.log('fbModel.cd:',r));
    this.fileBrowser = new FileBrowser({
      id: 'filebrowser',
      model: fbModel
    });

    fbModel.pathChanged.connect(this.pathChanged);
  }

  pathChanged = (browserModel: FileBrowserModel, changeProps: IChangedArgs<string>) => {
    this.setState({
      currentPath: changeProps.newValue
    });

    // Modify our URL so users can copy paste URLs
    const dirUrl = PageConfig.getBaseUrl() + 'simplest/tree/' + changeProps.newValue;
    history.pushState(
      null, '', dirUrl
    );
  }

  openItem = (item: Contents.IModel) => {
    const base_url = PageConfig.getBaseUrl();
    let target_url = '';
    // For notebooks, construct a simplest notebook URL
    if (item.type == 'notebook') {
      target_url = base_url + 'simplest/notebooks/' + item.path;
      window.open(target_url, '_blank');
    } else if (item.type == 'file') {
      target_url = base_url + 'view/' + item.path;
      window.open(target_url, '_blank');
    } else if (item.type == 'directory') {
      this.fileBrowser.model.cd(item.path).then(r => console.log(r));
    }
  }

  render() {
    // Put a / before and after path
    let displayPath = this.state.currentPath;
    if (!displayPath.startsWith('/')) {
      displayPath = '/' + displayPath;
    }
    if (!displayPath.endsWith('/')) {
      displayPath = displayPath + '/';
    }
    return (
        <FileBrowserComponent
          id="main-container"
          fileBrowser={this.fileBrowser}
          serviceManager={this.props.serviceManager}
          openItem={this.openItem}
        />
      )
  }
}
