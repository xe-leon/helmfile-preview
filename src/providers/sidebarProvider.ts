import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { findHelmfiles, findEnvironments, getCustomHelmfiles } from '../utilities/fsHelpers';
import HelmfileTemplateFileProvider from "../providers/helmfileTemplateFileProvider";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'helmfile-preview.sidebarView';

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, "out")],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    await this._editorChange();

    this._setWebviewMessageListener(webviewView.webview);

    this._disposables.push(
      vscode.window.onDidChangeActiveTextEditor(this._editorChange)
    );
  }

  public dispose(): void {
    if (this._view) {
      this._view = undefined;
    }

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public async _editorChange(editor?: vscode.TextEditor) {
    if (!this._view) {return;}

    let mapHelmfiles = await findHelmfiles();
    if(vscode.workspace.workspaceFolders){
      vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
        const customHelmfiles = getCustomHelmfiles(workspaceFolder.uri.fsPath+"/");
        if (customHelmfiles) {
          mapHelmfiles = new Map<string, string>([...mapHelmfiles.entries(), ...customHelmfiles.entries()]);
        }
      });
    }

    const helmfiles = JSON.stringify(Object.fromEntries(mapHelmfiles));
    const selectedFile = editor?.document.uri.fsPath;

    this._view.webview.postMessage({ command: 'updateFiles', map: helmfiles, selected: selectedFile });

    this._envUpdate(mapHelmfiles);
  }

  public _envUpdate(helmfiles: Map<string, string>) {
    if(!this._view) {return;}

    let environments = new Set<string>(["default"]);

    helmfiles.forEach(helmfile => {
      findEnvironments(helmfile).forEach(env => {
        environments = environments.add(env);
      });
    });
    const environmentsArray = Array.from(environments).sort();

    this._view.webview.postMessage({ command: 'updateEnvs', map: environmentsArray, selected: HelmfileTemplateFileProvider.stateEnvironment });
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const file = message.file;
        const env = message.env;
        const selectors = message.selectors;
        const prerun = message.prerun;

        switch (command) {
          case "render":
            HelmfileTemplateFileProvider.render(file, env, selectors, prerun, getNonce());
            return;

          case "selectEnv":
            HelmfileTemplateFileProvider.stateEnvironment = env;
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const webviewUri = getUri(webview, this._extensionUri, ["out", "webview.js"]);

    const nonce = getNonce();

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
          <title>Helmfile Template</title>
        </head>
        <body>
          <h3>Helmfile</h3>

          <vscode-dropdown id="dwnFile">
            <vscode-option>helmfile.yaml</vscode-option>
          </vscode-dropdown>

          <h3>Environment</h3>
          <vscode-dropdown id="dwnEnv">
            <vscode-option>default</vscode-option>
          </vscode-dropdown>

          <h3>Selectors</h3>
          <p>Specify filters for objects</p>
          <vscode-text-field id="txtSelector" placeholder="name=MyRelease,foo=bar"></vscode-text-field>

          <h3>Pre-run commands</h3>
          <p>For example, set environment variable</p>
          <vscode-text-field id="txtPrerun" placeholder="export CLUSTER_NAME=..."></vscode-text-field>
          <br><br>

					<vscode-button id="btnRender">Render</vscode-button>

					<script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }
}
