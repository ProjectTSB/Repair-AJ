import https from "https";
import { DownloadTimeOutError } from "../types/Error";

export async function download(url: string): Promise<string> {
    return await Promise.race<string>([
        new Promise<string>((resolve, reject) => {
            https.get(url, res => {
                let body = "";
                res.on("data", chunk => body += chunk);
                res.on("error", reject);
                res.on("end", () => resolve(body));
            }).end();
        }),
        setTimeOut(7000)
    ]);
}

export async function setTimeOut(milisec: number): Promise<never> {
    return await new Promise(
        (_, reject) => setTimeout(() => reject(new DownloadTimeOutError("ダウンロードの要求がタイムアウトしました。")), milisec)
    );
}
