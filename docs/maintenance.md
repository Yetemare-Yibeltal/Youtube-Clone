# Maintenance

## Routine tasks

| Frequency | Task                                                       |
| --------- | ---------------------------------------------------------- |
| Daily     | Check that `GET /health` responds and glance at error logs |
| Daily     | Confirm database backups completed                         |
| Weekly    | Review admin audit log and pending reports                 |
| Monthly   | Update dependencies and run the test suite                 |
| Monthly   | Check Cloudinary storage and bandwidth usage               |
| Quarterly | Restore a backup into a scratch database to prove it works |

## Backups

```bash
mongodump --uri "$MONGODB_URI" --out backup-$(date +%F)
```

Atlas customers can use continuous backups instead. Cloudinary keeps the media, so a database backup plus Cloudinary is a full backup.

## Dependency updates

```bash
cd server && npm outdated && npm update && npm test
cd client && npm outdated && npm update && npm run build
```

Update one major version at a time and read the changelog of Express, Mongoose, Vite and React Router first.

## Logs

The server logs to standard output with timestamps and levels. In production use your platform's log collection. Set `LOG_LEVEL` to `debug` temporarily when investigating a problem.

## Stuck uploads

Videos start as `processing` and become `published` within seconds. If the server restarts during that window the job is lost and the video stays in `processing`. List them from the admin Videos tab with the Processing filter, then either ask the owner to re-upload or publish them:

```js
db.videos.updateMany(
  { status: 'processing', createdAt: { $lt: new Date(Date.now() - 3600000) } },
  { $set: { status: 'published' } }
);
```

## Orphaned media

Deleting a video, channel or account removes its Cloudinary files on a best-effort basis. If a deletion call fails, the asset remains. Occasionally compare the `vidtube/` folders in Cloudinary with the `publicId` values in the database and remove files with no owner.

## Counters

If counters drift, recompute them. For channels:

```js
db.channels.find().forEach((channel) => {
  db.channels.updateOne(
    { _id: channel._id },
    {
      $set: {
        videosCount: db.videos.countDocuments({ channel: channel._id, status: 'published' }),
        subscribersCount: db.subscriptions.countDocuments({ channel: channel._id }),
      },
    }
  );
});
```

## Cleaning demo data

```bash
cd server
npm run seed:reset
```

This removes seeded users with their channels, videos and subscriptions, then recreates them. Uploaded demo files stay in Cloudinary.

## Indexes

Mongoose builds indexes at startup. After changing an index definition, drop the old index in MongoDB so the new one can be created.
