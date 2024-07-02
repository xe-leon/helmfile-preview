# Helmfile Preview

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

This extension renders your helmfile with chosen environment.

Generally based on [helm-template-preview-and-more](https://github.com/Nestsiarenka/helm-template-preview-and-more).

## Features

* Render currently opened helmfile, or just let it render the first helmfile it'll find.

![Open preview via command palette](media/demo/helmfile-command.gif)

* You can also use a button right in the editor.

![Open preview with button](media/demo/helmfile-button.png)

* Preview is being updated every time helmfile is saved.

![Auto update](media/demo/helmfile-realtime-update.gif)

* If you want to be more precise, you can open a sidemenu to choose specific environment and set a selector. Multiple opened directories supported.

![Precise settings in sidebar](media/demo/helmfile-sidebar.gif)

## Requirements

You need to have both [helmfile](https://helmfile.readthedocs.io/en/latest/#installation) and [helm](https://helm.sh/docs/intro/install/) binaries installed in your PATH (or executable specified in settings).

> TIP: If your helmfile references chart in **private** repository, you need to log in with `helm registry login`.

## Commands

To run any command, open command palette: `Ctrl` + `Shift` + `P` (Windows) / `Shift` + `Command` + `P` (Mac).

* `Helmfile: Render current file preview`: Render currently open helmfile in separate tab.

* `Helmfile: Find helmfile in workspace and render preview`: Find helmfile in current workspace and open its render.

## Extension Settings

This extension contributes the following settings:

| **Parameter**                    | **Description**                                                       | **Default value** |
|----------------------------------|-----------------------------------------------------------------------|-------------------|
| `helmfile-preview.file-names`    | Names of files that will be automatically searched as helmfile        | `helmfile`        |
| `helmfile-preview.file-exts`     | Extensions of files that are counted as helmfile                      | `*.yaml,*.yml`    |
| `helmfile-preview.environment`   | Default environment to choose                                         | `default`         |
| `helmfile-preview.exec-helmfile` | Path to `helmfile` executable                                         | `helmfile`        |
| `helmfile-preview.exec-helm`     | Path to `helm` executable                                             | `helm`            |

## Contribute

Feel free to open an issue or make a pull request.

I'm not a typescript programmer, so the code might be inefficient, weird or not-in-best-practice-way.

## TODO

* Support for entire directories of helmfiles with different names.

## Release Notes

### 1.0.0

Initial release of helmfile preview

---
