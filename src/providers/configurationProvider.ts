import * as vscode from "vscode";

export class ConfigurationProvider {
  private static configuration = vscode.workspace.getConfiguration("helmfile-preview");

  public static getConfigNames() {
    return ConfigurationProvider.configuration.get("file-names") as
      | string[]
      | undefined;
  }

  public static getConfigExtensions() {
    return ConfigurationProvider.configuration.get("file-exts") as
      | string[]
      | undefined;
  }

  public static getConfigDefaultEnvironment() {
    return ConfigurationProvider.configuration.get("environment") as
      | string
      | "default";
  }

  public static getConfigHelmfileBinary() {
    return ConfigurationProvider.configuration.get("exec-helmfile") as
      | string
      | "helmfile";
  }

  public static getConfigHelmBinary() {
    let helmBinary = ConfigurationProvider.configuration.get("exec-helm") as
      | string
      | undefined;

    return helmBinary !== "helm" ? helmBinary : undefined;
  }
}

export default ConfigurationProvider;
