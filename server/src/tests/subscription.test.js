import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_1234567890';

let mongod;
let app;
let Channel;
let Subscription;

async function registerAndLogin(overrides = {}) {
  const user = {
    username: 'subuser1',
    email: 'subuser1@example.com',
    fullName: 'Subscriber One',
    password: 'Passw0rd!',
    ...overrides,
  };

  await request(app).post('/api/v1/auth/register').send(user);
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: user.email, password: user.password });

  const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', loginRes.headers['set-cookie']);

  return { user, cookies: loginRes.headers['set-cookie'], userId: meRes.body.data._id };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
  ({ default: app } = await import('../app.js'));
  ({ default: Channel } = await import('../models/Channel.js'));
  ({ default: Subscription } = await import('../models/Subscription.js'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

describe('Subscription flow', () => {
  it('subscribes to a channel and increments its subscriber count', async () => {
    const creator = await registerAndLogin({ username: 'creatorA', email: 'creatorA@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator A', handle: 'creatora' });

    const viewer = await registerAndLogin({ username: 'viewerA', email: 'viewerA@example.com' });

    const res = await request(app)
      .post(`/api/v1/subscriptions/${channel._id}`)
      .set('Cookie', viewer.cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.subscribed).toBe(true);
    expect(res.body.data.subscribersCount).toBe(1);

    const updatedChannel = await Channel.findById(channel._id);
    expect(updatedChannel.subscribersCount).toBe(1);
  });

  it('unsubscribes on a second toggle call', async () => {
    const creator = await registerAndLogin({ username: 'creatorB', email: 'creatorB@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator B', handle: 'creatorb' });

    const viewer = await registerAndLogin({ username: 'viewerB', email: 'viewerB@example.com' });

    await request(app).post(`/api/v1/subscriptions/${channel._id}`).set('Cookie', viewer.cookies);
    const secondToggle = await request(app)
      .post(`/api/v1/subscriptions/${channel._id}`)
      .set('Cookie', viewer.cookies);

    expect(secondToggle.status).toBe(200);
    expect(secondToggle.body.data.subscribed).toBe(false);
    expect(secondToggle.body.data.subscribersCount).toBe(0);

    const count = await Subscription.countDocuments({ channel: channel._id });
    expect(count).toBe(0);
  });

  it('prevents a channel owner from subscribing to their own channel', async () => {
    const creator = await registerAndLogin({ username: 'creatorC', email: 'creatorC@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator C', handle: 'creatorc' });

    const res = await request(app)
      .post(`/api/v1/subscriptions/${channel._id}`)
      .set('Cookie', creator.cookies);

    expect(res.status).toBe(400);
  });

  it('reports accurate subscription status for a viewer', async () => {
    const creator = await registerAndLogin({ username: 'creatorD', email: 'creatorD@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator D', handle: 'creatord' });
    const viewer = await registerAndLogin({ username: 'viewerD', email: 'viewerD@example.com' });

    const beforeRes = await request(app)
      .get(`/api/v1/subscriptions/${channel._id}/status`)
      .set('Cookie', viewer.cookies);
    expect(beforeRes.body.data.subscribed).toBe(false);

    await request(app).post(`/api/v1/subscriptions/${channel._id}`).set('Cookie', viewer.cookies);

    const afterRes = await request(app)
      .get(`/api/v1/subscriptions/${channel._id}/status`)
      .set('Cookie', viewer.cookies);
    expect(afterRes.body.data.subscribed).toBe(true);
  });

  it('lists the channels a user is subscribed to', async () => {
    const creator = await registerAndLogin({ username: 'creatorE', email: 'creatorE@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator E', handle: 'creatore' });
    const viewer = await registerAndLogin({ username: 'viewerE', email: 'viewerE@example.com' });

    await request(app).post(`/api/v1/subscriptions/${channel._id}`).set('Cookie', viewer.cookies);

    const res = await request(app).get('/api/v1/subscriptions').set('Cookie', viewer.cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(1);
    expect(res.body.data.results[0].handle).toBe('creatore');
  });

  it('only allows the channel owner to view its subscriber list', async () => {
    const creator = await registerAndLogin({ username: 'creatorF', email: 'creatorF@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator F', handle: 'creatorf' });
    const viewer = await registerAndLogin({ username: 'viewerF', email: 'viewerF@example.com' });

    await request(app).post(`/api/v1/subscriptions/${channel._id}`).set('Cookie', viewer.cookies);

    const forbiddenRes = await request(app)
      .get(`/api/v1/subscriptions/${channel._id}/subscribers`)
      .set('Cookie', viewer.cookies);
    expect(forbiddenRes.status).toBe(403);

    const allowedRes = await request(app)
      .get(`/api/v1/subscriptions/${channel._id}/subscribers`)
      .set('Cookie', creator.cookies);
    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.data.results).toHaveLength(1);
  });

  it('updates the notification preference for an active subscription', async () => {
    const creator = await registerAndLogin({ username: 'creatorG', email: 'creatorG@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator G', handle: 'creatorg' });
    const viewer = await registerAndLogin({ username: 'viewerG', email: 'viewerG@example.com' });

    await request(app).post(`/api/v1/subscriptions/${channel._id}`).set('Cookie', viewer.cookies);

    const res = await request(app)
      .patch(`/api/v1/subscriptions/${channel._id}/preference`)
      .set('Cookie', viewer.cookies)
      .send({ notificationsEnabled: 'all' });

    expect(res.status).toBe(200);
    expect(res.body.data.notificationsEnabled).toBe('all');
  });

  it('rejects subscribing to a channel that does not exist', async () => {
    const viewer = await registerAndLogin({ username: 'viewerH', email: 'viewerH@example.com' });
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app).post(`/api/v1/subscriptions/${fakeId}`).set('Cookie', viewer.cookies);
    expect(res.status).toBe(404);
  });

  it('requires authentication to subscribe', async () => {
    const creator = await registerAndLogin({ username: 'creatorI', email: 'creatorI@example.com' });
    const channel = await Channel.create({ owner: creator.userId, name: 'Creator I', handle: 'creatori' });

    const res = await request(app).post(`/api/v1/subscriptions/${channel._id}`);
    expect(res.status).toBe(401);
  });
});