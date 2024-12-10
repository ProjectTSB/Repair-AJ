import { WorkspaceConfiguration } from "vscode";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Config {
}

const defaultConfig: Config = {};

export function constructConfig(custom: WorkspaceConfiguration, base = defaultConfig): Config {
    const config = {
        ...base, ...custom
    };

    console.log("config loaded.");
    console.log(JSON.stringify(config, undefined, " ".repeat(4)));

    return config;
}
