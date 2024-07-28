import * as vscode from 'vscode';
import ConfigurationProvider from "../providers/configurationProvider";

export class Logger {
  private static channel = vscode.window.createOutputChannel("Helmfile Preview");
  private static logLevel = ConfigurationProvider.getConfigLogLevel();
  private static levels = [
    "NONE",
    "ERROR",
    "WARNING",
    "INFO",
    "DEBUG"
  ];

  public static error(message: string, show=false) {
    Logger.write(message, 1, show);
  }
  public static warn(message: string, show = false) {
    Logger.write(message, 2, show);
  }

  public static info(message: string, show = false) {
    Logger.write(message, 3, show);
  }

  public static debug(message: string, show = false) {
    Logger.write(message, 4, show);
  }

  private static write(message: string, level: number, show?: boolean) {
    if (level <= Logger.logLevel) {
      Logger.channel.appendLine(Logger.levels[level] + ': ' + message);
      if (show) { Logger.channel.show(); }
    }
  }
}

export default Logger;
