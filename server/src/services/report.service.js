import Report from "../models/Report.js";
import Video from "../models/Video.js";
import Comment from "../models/Comment.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import ApiError from "../utils/apiError.js";
import {
  getPaginationParams,
  buildPaginatedResult,
} from "../utils/pagination.js";

const TARGETS = {
  video: { model: Video, field: "video", ownerOf: (doc) => doc.owner },
  comment: { model: Comment, field: "comment", ownerOf: (doc) => doc.owner },
  channel: { model: Channel, field: "channel", ownerOf: (doc) => doc.owner },
  user: { model: User, field: "reportedUser", ownerOf: (doc) => doc._id },
};

const REPORT_POPULATE = [
  { path: "reporter", select: "username fullName" },
  { path: "reviewedBy", select: "username" },
  { path: "video", select: "title thumbnail" },
  { path: "comment", select: "content" },
  { path: "channel", select: "name handle" },
  { path: "reportedUser", select: "username fullName" },
];

export async function createReport(
  reporterId,
  { targetType, targetId, reason, details = "" },
) {
  const target = TARGETS[targetType];
  if (!target) throw ApiError.badRequest("Unsupported report target");

  const document = await target.model.findById(targetId);
  if (!document)
    throw ApiError.notFound(`The reported ${targetType} was not found`);

  if (String(target.ownerOf(document)) === String(reporterId)) {
    throw ApiError.badRequest("You cannot report your own content");
  }

  const duplicate = await Report.findOne({
    reporter: reporterId,
    targetType,
    [target.field]: document._id,
    status: { $in: ["pending", "reviewing"] },
  });
  if (duplicate) throw ApiError.conflict("You have already reported this");

  return Report.create({
    reporter: reporterId,
    targetType,
    [target.field]: document._id,
    reason,
    details,
  });
}

export async function listReports(query) {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.targetType) filter.targetType = query.targetType;

  const [docs, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(REPORT_POPULATE)
      .lean(),
    Report.countDocuments(filter),
  ]);

  return buildPaginatedResult({ docs, total, page, limit });
}

export async function reviewReport(
  adminId,
  reportId,
  { status, reviewNote = "" },
) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound("Report not found");

  report.status = status;
  report.reviewNote = reviewNote;
  report.reviewedBy = adminId;
  await report.save();

  await AuditLog.create({
    actor: adminId,
    action: "admin.reviewReport",
    targetType: "Report",
    targetId: report._id,
    metadata: { status, reviewNote },
  }).catch(() => {});

  return report;
}

export default { createReport, listReports, reviewReport };
