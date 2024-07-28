import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { HelmfileTemplateFileProvider } from "./providers/helmfileTemplateFileProvider";
import { openCurrentPreview } from './commands/openCurrentPreview';
import { findFirstAndPreview } from './commands/findFirstAndPreview';
import { runKubeconform } from './commands/runKubeconform';
import { getNonce } from "./utilities/getNonce";

export function activate(context: vscode.ExtensionContext) {
  // Commands
  context.subscriptions.push(vscode.commands.registerCommand('helmfile-preview.openCurrentPreview', openCurrentPreview));
  context.subscriptions.push(vscode.commands.registerCommand('helmfile-preview.findFirstAndPreview', findFirstAndPreview));
  context.subscriptions.push(vscode.commands.registerCommand('helmfile-preview.runKubeconform', runKubeconform));

  // HelmfileProvider
  const helmfileProvider = new HelmfileTemplateFileProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      HelmfileTemplateFileProvider.scheme,
      helmfileProvider
    )
  );

  vscode.workspace.onDidSaveTextDocument(
    async (doc) => {
      if (HelmfileTemplateFileProvider.currentlyRendered.includes(doc.uri.fsPath))
      {
        HelmfileTemplateFileProvider.render(doc.uri.fsPath, undefined, undefined, undefined, getNonce());
      }
    }
  );

  vscode.workspace.onDidCloseTextDocument(async event => {
    if (HelmfileTemplateFileProvider.currentlyRendered.includes(event.uri.fsPath)) {
      const previewTabGroup = vscode.window.tabGroups.all;

      let previewTab;
      let i = 0;
      while (!previewTab || previewTab.length === 0) {
        previewTab = previewTabGroup[i].tabs.filter(tab =>
          (tab.input instanceof vscode.TabInputText) && (HelmfileTemplateFileProvider.currentlyRendered.includes(tab.input.uri.fsPath)) && (tab.input.uri.scheme === "htvf")
        );
        i++;
      }
      await vscode.window.tabGroups.close(previewTab, false);
      HelmfileTemplateFileProvider.currentlyRendered = "";
    }
  });

  const openEditors = new Set<string>();

  context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors((editors) => {
    const currentOpenEditors = new Set(editors.map(editor => editor.document.uri.toString()));

    for (const uriString of openEditors) {
      if (!currentOpenEditors.has(uriString)) {
        if(uriString.startsWith(HelmfileTemplateFileProvider.scheme)){
          HelmfileTemplateFileProvider.currentlyRendered = "";
        }
        openEditors.delete(uriString);
      }
    }

    for (const uriString of currentOpenEditors) {
      if (!openEditors.has(uriString)) {
        if (uriString.startsWith(HelmfileTemplateFileProvider.scheme)) {
          HelmfileTemplateFileProvider.currentlyRendered = uriString.replace(`${HelmfileTemplateFileProvider.scheme}:`, "");
        }
        openEditors.add(uriString);
      }
    }
  }));

  //SidebarProvider
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "helmfile-preview-sidebar",
      sidebarProvider
    ),
    sidebarProvider
  );

  vscode.window.onDidChangeActiveTextEditor(editor => {
      sidebarProvider._editorChange(editor);
  });
}

export function deactivate() { }
