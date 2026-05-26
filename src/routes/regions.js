const express = require('express');
const { requireAuthenticatedUser } = require('../lib/user-auth');
const {
  getRegionsStatus,
  getMetadata,
  getProvinces,
  getCities,
  getDistricts,
  getVillages
} = require('../lib/regions-store');

function handleRegionsError(error, res) {
  if (error.code === 'REGIONS_DATASET_NOT_FOUND') {
    res.status(503).json({
      error: 'Regions data is not generated',
      message: error.message
    });
    return;
  }

  throw error;
}

function createRegionsRouter() {
  const router = express.Router();

  router.use(requireAuthenticatedUser);

  router.get('/status', (req, res) => {
    res.json(getRegionsStatus());
  });

  router.get('/metadata', (req, res) => {
    try {
      res.json(getMetadata());
    } catch (error) {
      handleRegionsError(error, res);
    }
  });

  router.get('/provinces', (req, res) => {
    try {
      res.json({
        data: getProvinces()
      });
    } catch (error) {
      handleRegionsError(error, res);
    }
  });

  router.get('/cities', (req, res) => {
    const provinceCode = req.query.province_code;

    if (!provinceCode) {
      res.status(400).json({
        error: 'province_code is required'
      });
      return;
    }

    try {
      res.json({
        data: getCities(provinceCode)
      });
    } catch (error) {
      handleRegionsError(error, res);
    }
  });

  router.get('/districts', (req, res) => {
    const cityCode = req.query.city_code;

    if (!cityCode) {
      res.status(400).json({
        error: 'city_code is required'
      });
      return;
    }

    try {
      res.json({
        data: getDistricts(cityCode)
      });
    } catch (error) {
      handleRegionsError(error, res);
    }
  });

  router.get('/villages', (req, res) => {
    const districtCode = req.query.district_code;

    if (!districtCode) {
      res.status(400).json({
        error: 'district_code is required'
      });
      return;
    }

    try {
      res.json({
        data: getVillages(districtCode)
      });
    } catch (error) {
      handleRegionsError(error, res);
    }
  });

  return router;
}

module.exports = {
  createRegionsRouter
};
