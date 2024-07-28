import * as vscode from "vscode";
import * as path from "path";
import * as querystring from 'querystring';
import { execSync } from "child_process";
import ConfigurationProvider from "./configurationProvider";
import Logger from "../utilities/logger";


export class HelmfileTemplateFileProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  public static scheme = "htvf";
  public static stateEnvironment = "";
  public static stateSelectors = "";
  public static currentlyRendered = "";
  public fileUri = vscode.Uri.parse(`${HelmfileTemplateFileProvider.scheme}:helmfile`);

  provideTextDocumentContent(uri: vscode.Uri, __: vscode.CancellationToken): vscode.ProviderResult<string> {
    const args = querystring.parse(uri.query);
    const helmFileAbsPath = uri.path;
    const helmFileExtension = path.extname(helmFileAbsPath);
    const helmFileName = path.basename(helmFileAbsPath).slice(0, -helmFileExtension.length);
    this.fileUri = vscode.Uri.parse(`${HelmfileTemplateFileProvider.scheme}:${helmFileName}.Preview`);

    const helmfileBinary = ConfigurationProvider.getConfigHelmfileBinary();
    const helmBinary = ConfigurationProvider.getConfigHelmBinary();

    if (!helmFileAbsPath) {
      return "To see the template preview, open the editor with a Helmfile";
    }

    if (!ConfigurationProvider.getConfigExtensions()?.includes(helmFileExtension)) {
      Logger.error(`Unsupported file extension: ${helmFileExtension}`);
      return "This file is not a Helmfile";
    }

    const { stdout, stderr } = this.runHelmfileTemplate(helmFileAbsPath, args, false, helmfileBinary, helmBinary);

    if (stderr) {
      let { stdout: stdoutDebug, stderr: stderrDebug } = this.runHelmfileTemplate(helmFileAbsPath, args, true, helmfileBinary, helmBinary);

      Logger.error(`During rendering: ${stderr.toString()}`);
      vscode.window.showErrorMessage(`helmfile ${stderrDebug?.toString('utf8').split(/\n|\r/).filter(line => line.startsWith("err:"))}`);

      return (`#Error while rendering your helmfile.
#There might be an error somewhere in your helmfile.
#See the error message popped up for details.
#The output of render with --debug flag is listed below.

` + stdoutDebug.toString() + (stderrDebug !== undefined ? stderrDebug.toString() : ""));

    }

    return stdout.toString();
  }

  private runHelmfileTemplate(
    helmFileAbsPath: string,
    args: querystring.ParsedUrlQuery,
    isDebug: boolean,
    helmfileBinary = "helmfile",
    helmBinary?: string,
  ): {
    stdout: Buffer;
    stderr?: Buffer
  } {
    HelmfileTemplateFileProvider.stateEnvironment = args.environment && args.environment !== "undefined" ? args.environment.toString() : HelmfileTemplateFileProvider.stateEnvironment;
    let env = HelmfileTemplateFileProvider.stateEnvironment ? `-e ${HelmfileTemplateFileProvider.stateEnvironment}` : "";
    const selectros = args.selectors !== "undefined" ? `--selector ${args.selectors}` : "";
    const helm = helmBinary ? `--helm-binary ${helmBinary}` : "";
    const debug = isDebug ? "--debug" : "";
    const prerun = args.prerun !== "undefined" ? `${args.prerun} && ` : "";

    try {
      const command = `${prerun}${helmfileBinary} template --args='--no-hooks --skip-crds' --file ${helmFileAbsPath} ${env} ${selectros} ${debug} ${helm}`;
      Logger.info(`Exec command: ${command}`);
      HelmfileTemplateFileProvider.currentlyRendered = helmFileAbsPath;

      const stdout = execSync(command);

      return { stdout };
    } catch (e) {
      return e as { stdout: Buffer; stderr: Buffer };
    }
  }

  public static async render(file: string, env?: string, selectors?: string, prerun?: string, random?: string) {
    vscode.window.showInformationMessage(`Rendering helmfile in ${env ? env : "default"} environment`);

    if (!selectors || selectors === "") {selectors = undefined;}
    if (!prerun || prerun === "") {prerun = undefined;}

    const uri = vscode.Uri.parse(`${HelmfileTemplateFileProvider.scheme}://${file}?environment=${env}&selectors=${selectors}&prerun=${prerun}&random=${random}`);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document, {
      preview: true,
      preserveFocus: true,
      viewColumn: vscode.ViewColumn.Beside,
    });
    vscode.languages.setTextDocumentLanguage(document, "yaml");
  }
}

export default HelmfileTemplateFileProvider;
