import { MessageItem } from "vscode";

export type MessageItemHasId = MessageItem & { id: string };

export function createMessageItemHasIds(map: Map<string, string>): MessageItemHasId[] {
    const messages: MessageItemHasId[] = [];
    for (const id of map.keys())
        messages.push({ title: map.get(id)!, id });
    return messages;
}
