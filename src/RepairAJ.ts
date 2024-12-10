import { FileType, workspace } from "vscode";
import { Config } from "./types/Config";
import { listenPickItem, showError } from "./util/vscodeWrapper";
import { pathAccessible, readDir, readFile, writeFile } from "./util/file";
import path from "path";

export class RepairAJ {
  constructor(private config: Config) { }

  async run(): Promise<void> {
    const workspaceFolders = workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0];
    const wd = workspaceFolder?.uri.fsPath;
    if (!wd) {
      showError("ワークスペースが開かれていません");
      return;
    }
    if (!await pathAccessible(path.join(wd, "AnimatedJava"))) {
      showError("AnimatedJava ディレクトリが存在しません");
      return;
    }

    const modelNames = (await readDir(path.join(wd, "AnimatedJava/data/animated_java/functions")))
      .filter(([, type]) => type === FileType.Directory)
      .filter(([name]) => name !== "global")
      .map(([name]) => name)
      .sort();

    const repairTargetModelName = await this._listenRepairModel(modelNames);

    const animationNames = (await readDir(path.join(wd, `AnimatedJava/data/animated_java/functions/${repairTargetModelName}/animations`)))
      .filter(([, type]) => type === FileType.Directory)
      .map(([name]) => name)
      .sort();

    // 修正

    // #minecraft:load を animated_java:global/on_load と animated_java:global/internal/gu/load を書いたもので上書きする
    const vanillaLoadTagPath = path.join(wd, "AnimatedJava/data/minecraft/tags/functions/load.json");
    await writeFile(vanillaLoadTagPath, JSON.stringify({ values: ["animated_java:global/on_load", "animated_java:global/internal/gu/load"] }));

    // #minecraft:tick を animated_java:global/on_tick を書いたもので上書きする
    const vanillaTickTagPath = path.join(wd, "AnimatedJava/data/minecraft/tags/functions/tick.json");
    await writeFile(vanillaTickTagPath, JSON.stringify({ values: ["animated_java:global/on_tick"] }));

    // #animated_java:global/on_load を animated_java:(モデル名)/on_load モデルそれぞれの分で上書きする
    const globalOnLoadTagPath = path.join(wd, "AnimatedJava/data/animated_java/tags/functions/global/on_load.json");
    const globalOnLoadContent = JSON.stringify({ values: modelNames.map(name => `animated_java:${name}/on_load`) });
    await writeFile(globalOnLoadTagPath, globalOnLoadContent);

    // #animated_java:global/root/on_load を animated_java:(モデル名)/root/on_load モデルそれぞれの分で上書きする
    const globalRootOnLoadTagPath = path.join(wd, "AnimatedJava/data/animated_java/tags/functions/global/root/on_load.json");
    const globalRootOnLoadContent = JSON.stringify({ values: modelNames.map(name => `animated_java:${name}/root/on_load`) });
    await writeFile(globalRootOnLoadTagPath, globalRootOnLoadContent);

    // #animated_java:global/root/on_tick を animated_java:(モデル名)/root/on_tick モデルそれぞれの分で上書きする
    const globalRootOnTickTagPath = path.join(wd, "AnimatedJava/data/animated_java/tags/functions/global/root/on_tick.json");
    const globalRootOnTickContent = JSON.stringify({ values: modelNames.map(name => `animated_java:${name}/root/on_tick`) });
    await writeFile(globalRootOnTickTagPath, globalRootOnTickContent);

    // animated_java:(モデル名)/on_load
    //   - ファイル冒頭に残っている data remove storage  みたいな空(エラー)処理を削除する
    //   - ファイル冒頭に data remove storage aj.(モデル名):animations (アニメーション名) をアニメーションそれぞれの分書き足す
    //   - ファイル冒頭に scoreboard objectives add aj.(アニメーション名).frame dummy をアニメーションそれぞれの分書き足す
    const modelOnLoadPath = path.join(wd, `AnimatedJava/data/animated_java/functions/${repairTargetModelName}/on_load.mcfunction`);
    const modelOnLoadContent = (await readFile(modelOnLoadPath)).split("\n");
    const newModelOnLoadContent = [
      ...animationNames.map(name => `scoreboard objectives add aj.${name}.frame dummy`),
      ...animationNames.map(name => `data remove storage aj.${repairTargetModelName}:animations ${name}`),
      ...modelOnLoadContent.filter(line => !line.startsWith(`data remove storage aj.${repairTargetModelName}:animations`))
    ];
    await writeFile(modelOnLoadPath, newModelOnLoadContent.join("\n"));
  }

  private async _listenRepairModel(modelName: string[]): Promise<string> {
    return await listenPickItem("修正するモデルを選択してください", modelName, false);
  }
}
