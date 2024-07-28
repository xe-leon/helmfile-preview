import * as vscode from "vscode";

export class ConfigurationProvider {
  private static configuration = vscode.workspace.getConfiguration("helmfile-preview");

  public static getConfigNames() {
    return ConfigurationProvider.configuration.get("fileNames") as
      | string[]
      | undefined;
  }

  public static getConfigExtensions() {
    return ConfigurationProvider.configuration.get("fileExtensions") as
      | string[]
      | undefined;
  }

  public static getConfigNamesFilter() {
    return ConfigurationProvider.configuration.get("customNameFilter") as
      | string[]
      | undefined;
  }

  public static getConfigDefaultEnvironment() {
    return ConfigurationProvider.configuration.get("environment") as
      | string
      | "default";
  }

  public static getConfigKubeVersion() {
    return ConfigurationProvider.configuration.get("kubernetesVersion") as
      | string
      | "1.29.1";
  }

  public static getConfigStrictConform() {
    return ConfigurationProvider.configuration.get("kubeConformStrictValidation") as
      | boolean
      | true;
  }

  public static getConfigIgnoreMissingSchemas() {
    return ConfigurationProvider.configuration.get("kubeConformIgnoreMissingSchemas") as
      | boolean
      | false;
  }

  public static getConfigSchemaLocations() {
    return ConfigurationProvider.configuration.get("kubeConformSchemas") as
      | string[]
    | ["default", "https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json"];
  }

  public static getConfigLogLevel() {
    return ConfigurationProvider.configuration.get("logLevel") as
      | number
      | 0;
  }

  public static getConfigHelmfileBinary() {
    return ConfigurationProvider.configuration.get("helmfileExecutable") as
      | string
      | "helmfile";
  }

  public static getConfigHelmBinary() {
    let helmBinary = ConfigurationProvider.configuration.get("helmExecutable") as
      | string
      | undefined;

    return helmBinary !== "helm" ? helmBinary : undefined;
  }
}

export default ConfigurationProvider;
