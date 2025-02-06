import { RequestHandler } from 'express';

const getMyScanInfo: RequestHandler = (req, res) => {};

const getAllScanInfo: RequestHandler = (req, res) => {};

const getUserScanInfo: RequestHandler = (req, res) => {};

const getMyBins: RequestHandler = (req, res) => {};

const getAllBins: RequestHandler = (req, res) => {};

const getUserBins: RequestHandler = (req, res) => {};

export default {
  getMyScanInfo,
  getAllScanInfo,
  getUserScanInfo,
  getMyBins,
  getAllBins,
  getUserBins,
};
