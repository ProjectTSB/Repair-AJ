import { InputBoxOptions, ProgressLocation, QuickPickItem, Uri, window, workspace } from "vscode";
import { UserCancelledError } from "../types/Error";
import { MessageItemHasId } from "../types/MessageItemHasID";
import { Validator } from "../types/Validator";

export function getIndent(path: string): number {
    const config = workspace.getConfiguration("editor.tabSize", Uri.file(path));
    return config.get<number>("tabSize", 4);
}

export async function listenInput(message: string, validateInput?: Validator, otherOption?: InputBoxOptions): Promise<string> {
    const mes = message ? `${message}を入力` : "";
    const ans = await window.showInputBox({
        value: mes,
        placeHolder: "",
        prompt: mes,
        ignoreFocusOut: true,
        validateInput,
        ...otherOption
    });
    if (ans === undefined) throw new UserCancelledError();
    return ans;
}

export interface ListenDirOption {
    canSelectFiles?: boolean
    canSelectFolders?: boolean
    canSelectMany?: boolean
    defaultUri?: Uri
    filters?: { [key: string]: string[] }
}

interface Options {
    defaultUri?: Uri
    filter?: { [key: string]: string[] }
}

export function getOption(canSelectMany: false, opt?: Options): ListenDirOption & { canSelectMany: false };
export function getOption(canSelectMany: true, opt?: Options): ListenDirOption & { canSelectMany: true };
export function getOption(canSelectMany: boolean, opt: Options = {}): ListenDirOption {
    return {
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany,
        filters: opt.filter,
        defaultUri: opt.defaultUri
    };
}

export async function listenDir(title: string, openLabel: string, otherOption?: ListenDirOption & { canSelectMany?: false }): Promise<Uri>;
export async function listenDir(title: string, openLabel: string, otherOption?: ListenDirOption & { canSelectMany: true }): Promise<Uri[]>;
export async function listenDir(title: string, openLabel: string, option: ListenDirOption = {}): Promise<Uri | Uri[]> {
    const ans = await window.showOpenDialog({
        canSelectFiles: option.canSelectFiles ?? false,
        canSelectFolders: option.canSelectFolders ?? true,
        canSelectMany: option.canSelectMany ?? false,
        defaultUri: option.defaultUri ?? workspace.workspaceFolders?.[0].uri,
        openLabel,
        title,
        filters: option.filters
    }).then(v => option.canSelectMany ? v : v?.[0]);
    if (!ans) throw new UserCancelledError();
    return ans;
}

export async function listenPickItem<T extends string>(placeHolder: string, items: string[], canPickMany: false): Promise<T>;
export async function listenPickItem<T extends string>(placeHolder: string, items: string[], canPickMany: true): Promise<T[]>;
export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany: false): Promise<T>;
export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany: true): Promise<T[]>;
export async function listenPickItem<T extends QuickPickItem>(placeHolder: string, items: T[], canPickMany = true): Promise<T | T[]> {
    const ans = await window.showQuickPick(items, {
        canPickMany,
        ignoreFocusOut: true,
        matchOnDescription: false,
        matchOnDetail: false,
        placeHolder
    });
    if (!ans) throw new UserCancelledError();
    return ans;
}

export async function createProgressBar<T>(
    title: string,
    task: (report: (value: { increment?: number, message?: string }) => void) => Promise<T> | T
): Promise<T> {
    return await window.withProgress<T>({
        location: ProgressLocation.Notification,
        cancellable: false,
        title
    }, async progress => await task((value: { increment?: number, message?: string }) => progress.report(value)));
}

export async function showInfo(message: string, modal?: boolean): Promise<void>;
export async function showInfo(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showInfo(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showInformationMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showInformationMessage(message, { modal });
    return;
}

export async function showWarning(message: string, modal?: boolean): Promise<void>;
export async function showWarning(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showWarning(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showWarningMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showWarningMessage(message, { modal });
    return;
}

export async function showError(message: string, modal?: boolean): Promise<void>;
export async function showError(message: string, modal: boolean, items: MessageItemHasId[], cancelledString?: string[]): Promise<string>;
export async function showError(message: string, modal?: boolean, items?: MessageItemHasId[], cancelledString?: string[]): Promise<string | void> {
    if (items) {
        const ans = await window.showErrorMessage(message, { modal }, ...items);
        if (!ans || cancelledString?.includes(ans.id)) throw new UserCancelledError();
        return ans.id;
    }
    await window.showErrorMessage(message, { modal });
    return;
}
