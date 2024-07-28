import * as vscode from 'vscode';
import HelmfileTemplateFileProvider from "../providers/helmfileTemplateFileProvider";
import { findHelmfiles } from '../utilities/fsHelpers';
import Logger from "../utilities/logger";

export async function findFirstAndPreview() {
  const helmfilePath = (await findHelmfiles()).entries().next().value[1];

  if (!helmfilePath) {
    Logger.error("No helmfile found in workspace");
    return vscode.window.showInformationMessage('No helmfile found in workspace');
  }

  HelmfileTemplateFileProvider.render(helmfilePath);
}
