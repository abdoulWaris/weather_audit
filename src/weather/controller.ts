import express from "express";
import { validateRequest } from "zod-express-middleware";
import { WeatherData, WeatherDataSchema, WeatherFilterSchema } from "./dto.js";
import WeatherService from "./service.js";
import logger from "../logger.js";

// Utilisation d'Express Router
const router = express.Router();

/**
 * Ajoute des données météorologiques
 */
router.post(
  "/data",
  validateRequest({ body: WeatherDataSchema }),
  async (req, res) => {
    const data: WeatherData = req.body;

    try {
      await WeatherService.addData(data);
      return res.status(201).json({
        message: "Données ajoutées avec succès",
        data,
      });
    } catch (error) {
      // Modifiaction du message d'erreur pour plus de clarté
      logger.error("Erreur POST /data:", error);
      return res.status(500).json({
        error: "Erreur lors de l'ajout des données",
      });
    }
  }
);

/**
 * Récupère les données pour une location donnée
 */
router.get(
  "/data/:location",
  validateRequest({ query: WeatherFilterSchema }),
  async (req, res) => {
    const { location } = req.params;
    const options = req.query;
    try {
      const data = await WeatherService.getData(location, options);
      //
      // Ajout d'une gestion d'erreur si aucune donnée n'est trouvée
      if (data === null) {
        return res.status(404).json({
          error: `Aucune donnée trouvée pour ${location}`,
        });
      }

      // Retourne également le nombre de résultats
      return res.json({
        location,
        count: data.length,
        data,
      });
    } catch (error) {
      // Modifiaction du message d'erreur
      logger.error("Erreur GET /data/:location:", error);
      return res.status(500).json({
        error: "Erreur lors de la récupération des données",
      });
    }
  }
);

/** 
 * Récupère la température maximale pour une location donnée 
 */
router.get(
  "/avg/:location",
  validateRequest({ query: WeatherFilterSchema }),
  async (req, res) => {
    const { location } = req.params;
    const options = req.query;

    try {
      const avg = await WeatherService.getMean(location, options);

      // Ajout d'une gestion d'erreur si aucune donnée n'est trouvée
      if (avg === null) {
        return res.status(404).json({
          error: `Aucune donnée trouvée pour ${location}`,
        });
      }

      return res.json({
        location,
        avg,
      });
    } catch (error) {
      // Modifiaction du message d'erreur
      logger.error("Erreur GET /avg/:location:", error);
      return res.status(500).json({
        error: "Erreur lors du calcul de la moyenne",
      });
    }
  }
);

/**
 * Récupère la valeur maximale
 * */
router.get(
  "/max/:location",
  validateRequest({ query: WeatherFilterSchema }),
  async (req, res) => {
    const { location } = req.params;
    const options = req.query;
    try {
      const max = await WeatherService.getMax(location, options);
      
      // Ajout d'une gestion d'erreur si aucune donnée n'est trouvée
      if (max === null) {
        return res.status(404).json({
          error: `Aucune donnée trouvée pour ${location}`,
        });
      }
      
      return res.json({location, max });
    } catch (error) {
      logger.error("Erreur GET /max/:location:", error);
      return res.status(500).json({
        error: "Erreur lors de la récupération des données maximales",
      });
    }
  }
);

/**
 * Récupère les données minimales
 */
router.get(
  "/min/:location",
  validateRequest({ query: WeatherFilterSchema }),
  async (req, res) => {
    const { location } = req.params;
    const options = req.query;
    try {
      const min = await WeatherService.getMin(location, options);
      
      // Ajout d'une gestion d'erreur si aucune donnée n'est trouvée
      if (min === null) {
        return res.status(404).json({
          error: `Aucune donnée trouvée pour ${location}`,
        });
      }

      return res.json({ location, min });
    } catch (error) {
      logger.error("Erreur GET /min/:location:", error);
      return res.status(500).json({
        error: "Erreur lors de la récupération des données minimales",
      });
    }
  }
);

/**
 * Récupère toutes les statistiques en une fois
 * */
router.get(
  '/stats/:location',
  validateRequest({ query: WeatherFilterSchema }),
  async (req, res) => {
    const { location } = req.params;
    const options = req.query;

    try {
      const stats = await WeatherService.getAllStats(location, options);

      if (stats === null) {
        return res.status(404).json({ 
          error: `Aucune donnée trouvée pour ${location}` 
        });
      }

      return res.json({ 
        location,
        statistics: {
          mean: stats.mean,
          max: stats.max,
          min: stats.min
        }
      });
    } catch (error) {
      logger.error('Erreur GET /stats/:location:', error);
      return res.status(500).json({ 
        error: 'Erreur lors du calcul des statistiques' 
      });
    }
  }
);

export default router;
