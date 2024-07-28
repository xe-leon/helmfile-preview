import * as vscode from 'vscode';
import { execSync } from "child_process";
import ConfigurationProvider from "../providers/configurationProvider";
import Logger from "../utilities/logger";

export function runKubeconform() {
  const kubeVersion = "--kubernetes-version=" + ConfigurationProvider.getConfigKubeVersion();
  const strictValidation = ConfigurationProvider.getConfigStrictConform() ? "--strict" : "";
  const ignoreMissingSchemas = ConfigurationProvider.getConfigIgnoreMissingSchemas() ? "-ignore-missing-schemas" : "";
  const schema = ConfigurationProvider.getConfigSchemaLocations();
  const stdin = vscode.window.activeTextEditor?.document.getText();
  const schemasArg = schema.map((i) => `--schema-location "${i}" `).join(" ");
  const command = `kubeconform ${strictValidation} ${ignoreMissingSchemas} ${kubeVersion} ${schemasArg} -n 16 -summary -output json`;

  try {
    const output = execSync(command, {input: stdin});
    reportResult(output);
  }
  catch (err) {
    const output = err as { stdout: Buffer; stderr: Buffer };
    reportResult(output.stdout, output.stderr);
  }
}

function reportResult(stdout: Buffer, stderr?: Buffer) {
  const resultObj = JSON.parse(stdout.toString());

  if (resultObj["summary"]["invalid"] > 0 || resultObj["summary"]["errors"] > 0) {
    vscode.window.showErrorMessage(`Kubeconform failed.
      Valid: ${resultObj["summary"]["valid"]}
      Errors: ${resultObj["summary"]["errors"]}
      Invalid: ${resultObj["summary"]["invalid"]}
      Skipped: ${resultObj["summary"]["skipped"]}. See output for info.
    `);
    Logger.error(stdout.toString('utf8'), true);
    if (stderr) { Logger.debug(stderr.toString('utf8')); }
  } else {
    vscode.window.showInformationMessage(`Kubeconform successful!
      Valid: ${resultObj["summary"]["valid"]}
      Skipped: ${resultObj["summary"]["skipped"]}
    `);
    Logger.info(stdout.toString('utf8'));
    if (stderr) { Logger.debug(stderr.toString('utf8')); }
  }
}
