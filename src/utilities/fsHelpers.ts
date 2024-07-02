import * as vscode from 'vscode';
import * as path from "path";
import * as fs from 'fs';
import * as yaml from 'yaml';
import ConfigurationProvider from "../providers/configurationProvider";

export function findEnvironments(filePath: string): string[] {
  const file = fs.readFileSync(filePath, 'utf8');
  const helmfiles = yaml.parseAllDocuments(file).map(doc => doc.toJSON());

  const environments: string[] = [];

  helmfiles.forEach(helmfileContent => {
    if (helmfileContent.environments) {
      Object.keys(helmfileContent.environments).forEach(envName => {
        environments.push(envName);
      });
    }
  });

  return environments;
}

export async function findHelmfiles(): Promise<Map<string, string>> {
  const namePatterns = ConfigurationProvider.getConfigNames();
  const extensionPatterns = ConfigurationProvider.getConfigExtensions();

  if (!namePatterns || !extensionPatterns) return new Map<string, string>();

  const globPattern = `**/{${namePatterns.join(",")}}{${extensionPatterns.join(",")}}`;
  const files = await vscode.workspace.findFiles(globPattern);

  if (files.length === 0) return new Map<string, string>();

  const filePaths = new Map(files.map(file => [stripFolderPath(file.fsPath), file.fsPath]));

  return filePaths;
}

export function stripFolderPath(fsPath: string): string {
  const folders = getWorkspaceFolders();
  if (!folders) return fsPath;

  const containingFolder = folders.filter(element => fsPath.includes(element));
  containingFolder.sort((a, b) => b.length - a.length);

  if (!containingFolder) return fsPath;

  return fsPath.replace(containingFolder[0], path.basename(containingFolder[0]));
}

export function getWorkspaceFolders() {
  return vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) as
    | string[]
    | undefined;
}
