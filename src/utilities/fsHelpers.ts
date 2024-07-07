import * as vscode from 'vscode';
import * as path from "path";
import * as fs from 'fs';
import * as yaml from 'yaml';
import ignore, { Ignore } from 'ignore';
import ConfigurationProvider from "../providers/configurationProvider";

export function getCustomHelmfiles(rootDir: string): Map<string, string> | undefined {
  const ignoreTemplates = ConfigurationProvider.getConfigNamesFilter();
  if (!ignoreTemplates) { return undefined; }

  const customHelmfiles = getFilesFiltered(rootDir, ignore().add(ignoreTemplates), rootDir);

  return new Map(customHelmfiles.map(file => [stripFolderPath(file), file]));
}

function getFilesFiltered(rootPath: string, ig: Ignore, igRootDir: string, fileList: string[] = []) {
  const files = fs.readdirSync(rootPath);

  files.forEach((file) => {
      const filePath = path.join(rootPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        getFilesFiltered(filePath, ig, igRootDir, fileList);
      } else {
        if (ig.ignores(filePath.replace(igRootDir, ""))){
          fileList.push(filePath);
        }
      }
  });

  return fileList;
}

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

  if (!namePatterns || !extensionPatterns) { return new Map<string, string>(); }

  const globPattern = `**/{${namePatterns.join(",")}}{${extensionPatterns.join(",")}}`;
  const files = await vscode.workspace.findFiles(globPattern);

  if (files.length === 0) { return new Map<string, string>(); }

  const filePaths = new Map(files.map(file => [stripFolderPath(file.fsPath), file.fsPath]));

  return filePaths;
}

function stripFolderPath(fsPath: string): string {
  const folders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath);
  if (!folders) { return fsPath; }

  const containingFolder = folders.filter(element => fsPath.includes(element));
  containingFolder.sort((a, b) => b.length - a.length);

  if (!containingFolder) { return fsPath; }

  if (vscode.workspace.workspaceFolders?.length === 1){
    return fsPath.replace(containingFolder[0]+"/", "");
  } else {
    return fsPath.replace(containingFolder[0], path.basename(containingFolder[0]));
  }

}
