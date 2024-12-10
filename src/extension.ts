import { commands, Disposable, ExtensionContext, StatusBarAlignment, window, workspace } from "vscode";
import { UserCancelledError } from "./types/Error";
import { showError, showInfo } from "./util/vscodeWrapper";
import { constructConfig } from "./types/Config";
import { RepairAJ } from "./RepairAJ";
import path from "path";
import { pathAccessible } from "./util/file";

export const codeConsole = window.createOutputChannel("Repair AJ");
const repairCommandId = "repair-aj.repair";

export function activate(context: ExtensionContext): void {
    const disposable: Disposable[] = [];

    disposable.push(commands.registerCommand(repairCommandId, run));

    const workspaceFolders = workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0];
    const wd = workspaceFolder?.uri.fsPath;

    if (wd) {
        pathAccessible(path.join(wd, "AnimatedJava")).then(isAccessible => {
            if (!isAccessible) {
                console.log("AnimatedJava is not accessible");
                return;
            }

            const statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
            statusBar.command = repairCommandId;
            statusBar.text = "Repair AJ";
            statusBar.tooltip = "Repair AJ";
            statusBar.show();
        });
    }

    context.subscriptions.push(...disposable);
}

export function deactivate(): void { }

async function run(): Promise<void> {
    try {
        const config = constructConfig(workspace.getConfiguration("repairAJ"));
        // Generator
        const generator = new RepairAJ(config);
        // 実行
        await generator.run();
        // 終了メッセージ
        showInfo("修正したよ");
    } catch (e: unknown) {
        if (e instanceof UserCancelledError) {
            return;
        }
        if (e instanceof Error) {
            showError(e.message);
            codeConsole.appendLine(e.stack ?? e.toString());
        } else {
            const ee = e as { toString(): string };
            showError(`予期しないエラーがが発生しました。以下の内容を作者に教えていただけると解決できる場合があります。\n${ee.toString()}`);
            codeConsole.appendLine(ee.toString());
        }
    }
}
