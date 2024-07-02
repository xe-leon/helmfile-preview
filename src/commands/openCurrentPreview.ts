import * as vscode from 'vscode';
import HelmfileTemplateFileProvider from "../providers/helmfileTemplateFileProvider";

export async function openCurrentPreview() {
  const currentFileAbsPath = vscode.window.activeTextEditor?.document.uri.fsPath;
  if(!currentFileAbsPath) return;

  const answerEnv = await vscode.window.showInputBox({
    prompt: "helmfile environment",
    placeHolder: `${HelmfileTemplateFileProvider.stateEnvironment ? HelmfileTemplateFileProvider.stateEnvironment : "default"}`
  });
  HelmfileTemplateFileProvider.render(currentFileAbsPath, answerEnv);
}
