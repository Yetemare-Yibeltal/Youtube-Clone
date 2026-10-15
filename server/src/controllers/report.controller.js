import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import * as reportService from "../services/report.service.js";

export const createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user._id, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, report, "Report submitted successfully"));
});

export const listReports = asyncHandler(async (req, res) => {
  const result = await reportService.listReports(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Reports fetched successfully"));
});

export const reviewReport = asyncHandler(async (req, res) => {
  const report = await reportService.reviewReport(
    req.user._id,
    req.params.reportId,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, report, "Report updated successfully"));
});
