import type { DefaultEventsMap } from "socket.io/dist/typed-events";
import type { User } from "@/utils/types";

declare module "socket.io" {
	// biome-ignore lint/style/useConsistentTypeDefinitions: <>
	interface Socket<
		ListenEvents extends DefaultEventsMap = DefaultEventsMap,
		EmitEvents extends DefaultEventsMap = DefaultEventsMap,
		ServerSideEvents extends DefaultEventsMap = DefaultEventsMap,
		// biome-ignore lint/suspicious/noExplicitAny: <>
		SocketData = any,
	> {
		user: User;
		__msgCountWindowStart?: number;
		__msgCountInWindow?: number;
	}
}