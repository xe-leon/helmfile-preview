import * as vscode from 'vscode';
import HelmfileTemplateFileProvider from "../providers/helmfileTemplateFileProvider";
import * as path from 'path';
import { findHelmfiles } from '../utilities/fsHelpers';

export async function findFirstAndPreview() {
  const helmfilePath = (await findHelmfiles()).entries().next().value[1];

  if (!helmfilePath)
    return vscode.window.showInformationMessage('No helmfile found in workspace');

  HelmfileTemplateFileProvider.render(helmfilePath);
}
