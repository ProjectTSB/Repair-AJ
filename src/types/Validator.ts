export type Validator = (value: string) => Thenable<string | undefined> | string | undefined;

export function intValidator(str: string, mes: string): undefined | string {
    return /^[1-9][0-9]*$/.test(str) && Number.parseInt(str) <= 2147483647 ? undefined : mes;
}
