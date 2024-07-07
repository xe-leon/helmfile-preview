import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { HelmfileTemplateFileProvider } from "./providers/helmfileTemplateFileProvider";
import { openCurrentPreview } from './commands/openCurrentPreview';
import { findFirstAndPreview } from './commands/findFirstAndPreview';

export function activate(context: vscode.ExtensionContext) {
  // Commands
  context.subscriptions.push(vscode.commands.registerCommand('helmfile-preview.openCurrentPreview', openCurrentPreview));
  context.subscriptions.push(vscode.commands.registerCommand('helmfile-preview.findFirstAndPreview', findFirstAndPreview));

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
      if (doc.uri.fsPath === HelmfileTemplateFileProvider.currentlyRendered)
        HelmfileTemplateFileProvider.(doc.uri.fsPath);
    }
  );

  vscode.workspace.onDidCloseTextDocument(async event => {
    if (event.uri.fsPath === HelmfileTemplateFileProvider.currentlyRendered) {
      const previewTabGroup = vscode.window.tabGroups.all;

      let previewTab;
      let i = 0;
      while (!previewTab || previewTab.length === 0) {
        previewTab = previewTabGroup[i].tabs.filter(tab =>
          (tab.input instanceof vscode.TabInputText) && (tab.input.uri.fsPath === HelmfileTemplateFileProvider.currentlyRendered) && (tab.input.uri.scheme === "htvf")
        );
        i++;
      }
      await vscode.window.tabGroups.close(previewTab, false);
    }
  });
  // ! Troubled behavior
  // vscode.window.onDidChangeActiveTextEditor(
  //   async (e) => {
  //     const uri = vscode.Uri.parse(`${HelmfileTemplateFileProvider.scheme}://${e?.document.uri.fsPath}`);
  //     const document = await vscode.workspace.openTextDocument(uri);
  //     await vscode.window.showTextDocument(document, {
  //       preview: true,
  //       preserveFocus: true,
  //       viewColumn: vscode.ViewColumn.Beside
  //     });
  //     vscode.languages.setTextDocumentLanguage(document, "yaml");
  //   }
  // );

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
