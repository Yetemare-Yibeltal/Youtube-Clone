import * as Subscription from "../models/Subscription.js";
import * as Channel from "../models/Channel.js";
import { ApiError } from "../utils/apiError.js";

export const subscribe = async (user, handle) => {
  const channel = await Channel.findByHandle(handle);
  if (!channel) throw ApiError.notFound("Channel not found");
  if (channel.user_id === user.id)
    throw ApiError.badRequest("You cannot subscribe to your own channel", {
      code: "SELF_SUBSCRIBE",
    });

  await Subscription.subscribe({ userId: user.id, channelId: channel.id });
  return { subscribed: true };
};

export const unsubscribe = async (user, handle) => {
  const channel = await Channel.findByHandle(handle);
  if (!channel) throw ApiError.notFound("Channel not found");

  await Subscription.unsubscribe({ userId: user.id, channelId: channel.id });
  return { subscribed: false };
};

export const listMine = async (userId, { page, limit }) => {
  const { items, hasNextPage } = await Subscription.listMine(userId, {
    limit,
    offset: (page - 1) * limit,
  });
  return {
    subscriptions: items.map(Subscription.toPublicSubscription),
    meta: { page, limit, hasNextPage },
  };
};
