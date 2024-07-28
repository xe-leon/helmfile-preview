import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { findHelmfiles, findEnvironments, getCustomHelmfiles } from '../utilities/fsHelpers';
import HelmfileTemplateFileProvider from "../providers/helmfileTemplateFileProvider";
import Logger from "../utilities/logger";

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

    Logger.debug(`Looking for helmfiles in current project`);
    let mapHelmfiles = await findHelmfiles();
    if(vscode.workspace.workspaceFolders){
      vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
        Logger.debug(`Looking for custom-named helmfiles`);
        const customHelmfiles = getCustomHelmfiles(workspaceFolder.uri.fsPath+"/");
        if (customHelmfiles) {
          mapHelmfiles = new Map<string, string>([...mapHelmfiles.entries(), ...customHelmfiles.entries()]);
        }
      });
    }

    const helmfiles = JSON.stringify(Object.fromEntries(mapHelmfiles));
    const selectedFile = editor?.document.uri.fsPath;

    Logger.debug(`Updating selected helmfile in sidebar`);
    this._view.webview.postMessage({ command: 'updateFiles', map: helmfiles, selected: selectedFile });

    this._envUpdate(mapHelmfiles);
  }

  public _envUpdate(helmfiles: Map<string, string>) {
    if(!this._view) {return;}

    let environments = new Set<string>(["default"]);

    Logger.debug(`Getting list of environments from all helmfiles`);
    helmfiles.forEach(helmfile => {
      findEnvironments(helmfile).forEach(env => {
        environments = environments.add(env);
      });
    });
    const environmentsArray = Array.from(environments).sort();
    Logger.debug(`Environments: ${environmentsArray.toString()}`);

    Logger.debug(`Updating environment selector in sidebar`);
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
        Logger.info(`Received command from sidebar: ${command}`);
        Logger.debug(`file=${file}, env=${env}, selectors=${selectors}, Pre-run commands=${prerun}`);

        switch (command) {
          case "render":
            Logger.info(`Rendering helmfile`);
            HelmfileTemplateFileProvider.render(file, env, selectors, prerun, getNonce());
            return;

          case "selectEnv":
            Logger.debug(`Saving selected environment`);
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
