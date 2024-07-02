import { provideVSCodeDesignSystem, vsCodeBadge, vsCodeButton, Button, vsCodeCheckbox, vsCodeDivider, vsCodeDropdown, vsCodeLink, vsCodeOption, vsCodePanels, vsCodeProgressRing, vsCodeRadio, vsCodeRadioGroup, vsCodeTag, vsCodeTextArea, vsCodeTextField, TextField, Dropdown } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeBadge(), vsCodeButton(), vsCodeCheckbox(), vsCodeDivider(), vsCodeDropdown(), vsCodeLink(), vsCodeOption(), vsCodePanels(), vsCodeProgressRing(), vsCodeRadio(), vsCodeRadioGroup(), vsCodeTag(), vsCodeTextArea(), vsCodeTextField());

const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const btnRender = document.getElementById("btnRender") as Button;
  btnRender?.addEventListener("click", handleRenderClick);

  const dwnEnv = document.getElementById("dwnEnv") as Dropdown;
  dwnEnv?.addEventListener("change", handleEnvSelect);

  setWidth(100);
}

function handleRenderClick() {
  const dwnFile = document.getElementById("dwnFile") as Dropdown;
  const dwnEnv = document.getElementById("dwnEnv") as Dropdown;
  const txtSelector = document.getElementById("txtSelector") as TextField;
  const txtPrerun = document.getElementById("txtPrerun") as TextField;

  vscode.postMessage({
    command: "render",
    file: dwnFile.value,
    env: dwnEnv.value,
    selectors: txtSelector.currentValue,
    prerun: txtPrerun.currentValue,
  });
}

function handleEnvSelect() {
  const dwnEnv = document.getElementById("dwnEnv") as Dropdown;

  vscode.postMessage({
    command: "selectEnv",
    env: dwnEnv.value
  });
}

function setWidth(percent: number) {
  const dwnFile = document.getElementById("dwnFile") as Dropdown;
  const dwnEnv = document.getElementById("dwnEnv") as Dropdown;
  const txtSelector = document.getElementById("txtSelector") as TextField;
  const txtPrerun = document.getElementById("txtPrerun") as TextField;
  const btnRender = document.getElementById("btnRender") as Button;

  dwnFile.style.width = `${percent}%`;
  dwnEnv.style.width = `${percent}%`;
  txtSelector.style.width = `${percent}%`;
  txtPrerun.style.width = `${percent}%`;
  btnRender.style.width = `${percent}%`;
}

window.addEventListener('message', event => {
  const message = event.data;

  switch (message.command) {
    case 'updateFiles':
      const dwnFile = document.getElementById('dwnFile') as Dropdown;
      let dropdownHelmfileOptionsHtml = "";
      const helmfiles = JSON.parse(message.map);
      const selectedFile = message.selected;

      Object.keys(helmfiles).forEach(function(key) {
        dropdownHelmfileOptionsHtml += `
        <vscode-option value="${helmfiles[key]}">${key}</vscode-option>`;
      });

      if (dwnFile !== null){
        dwnFile.innerHTML = dropdownHelmfileOptionsHtml;
        dwnFile.value = selectedFile;
      }
      break;

    case 'updateEnvs':
      const dwnEnv = document.getElementById('dwnEnv') as Dropdown;
      let dropdownEnvOptionsHtml = "";
      const environments = message.map as string[];
      const selectedEnv = message.selected;

      environments.forEach(env => {
        dropdownEnvOptionsHtml += `
        <vscode-option value="${env}">${env}</vscode-option>`;
      });

      if (dwnEnv !== null) {
        dwnEnv.innerHTML = dropdownEnvOptionsHtml;
        dwnEnv.value = selectedEnv;
      }
      break;
  }
});
