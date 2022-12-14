import PusherClientBase, { Channel } from "pusher-js";
import PusherServerBase from "pusher";

type channelEvt =
  | "added_post"
  | "added_comment"
  | "liked_post"
  | "unliked_post"
  | "updated_info";

type pusherChannels = "main";

export const pusherServer = () =>
  new PusherServerBase({
    appId: "1527834",
    key: "8800cf5b24ddc5c1c620",
    secret: "c08be3e757267982ba71",
    cluster: "us2",
    useTLS: true,
  });

PusherClientBase.logToConsole = true;
export const pusherClient = new PusherClientBase("8800cf5b24ddc5c1c620", {
  cluster: "us2",
  forceTLS: true,
});

export const useChannel = (
  channel: pusherChannels
): {
  Subscription: Channel;
  BindEvent: <T = void>(
    event: channelEvt,
    callback: (data: T) => any
  ) => Channel;
  BindNRefetch: <T = void>(
    events: channelEvt[],
    refetchFnt: () => any
  ) => Channel[];
} => {
  const Subscription = pusherClient.subscribe(channel);

  function BindEvent<T = void>(
    event: string,
    callback: (data: T) => any
  ): Channel {
    return Subscription.bind(event, callback);
  }

  function BindNRefetch<T = void>(
    events: channelEvt[],
    refetchFnt: (data: T) => any
  ): Channel[] {
    return events.map((e) => Subscription.bind(e, refetchFnt));
  }

  return { Subscription, BindEvent, BindNRefetch };
};

export async function triggerEvent<D = void>(
  channel: pusherChannels,
  event: channelEvt,
  data: D
): Promise<PusherServerBase.Response>;
export async function triggerEvent<D = void>(
  channel: string[],
  event: channelEvt,
  data: D
): Promise<PusherServerBase.Response>;
export async function triggerEvent<D = void>(
  channel: string | string[],
  event: channelEvt,
  data: D
): Promise<PusherServerBase.Response | Promise<PusherServerBase.Response>[]> {
  if (Array.isArray(channel)) {
    return channel.map((chan) => pusherServer().trigger(chan, event, data));
  }

  return pusherServer().trigger(channel, event, data);
}
