import repositoryInstance, { WeatherDataRepository } from "./repository.js";
import { WeatherData, WeatherFilter } from "./dto.js";
import logger from "../logger.js";
export class WeatherService {
  private weatherRepository: WeatherDataRepository;

  constructor() {
    this.weatherRepository = repositoryInstance;
  }
  /**
   * Ajoute une nouvelle donnée météorologique
   */
  async addData(data: WeatherData) {
    try {
      await this.weatherRepository.insertWeatherData(data);
      logger.info(`Données ajoutées pour ${data.location} le ${data.date}`);
    } catch (error) {
      logger.error(
        "Erreur lors de l'ajout des données météorologiques:",
        error
      );
      throw error;
    }
  }

  /**
   * OPTIMISÉ: Récupère les données avec filtrage SQL
   * (plus besoin de filtrage en mémoire)
   */
  async getData(location: string, options: WeatherFilter) {
    const { from, to } = options;
    try {
      const data =
        await this.weatherRepository.getWeatherDataByLocationAndDateRange(
          location,
          from,
          to
        );

      if (data === null || data.length === 0) {
        logger.info(`Aucune donnée trouvée pour ${location}`);
        return null;
      }
      return data;
    } catch (error) {
      logger.error(
        "Erreur lors de la récupération des données météorologiques:",
        error
      );
      throw error;
    }
  }

  /**
   * OPTIMISÉ: Calcule la moyenne via SQL
   */
  async getMean(location: string, options: WeatherFilter) {
   const { from, to } = options;
   // Utilisation de la nouvelle méthode du repository et ajout d'une exception
   try {
    const stats = await this.weatherRepository.getTemperatureStats(
      location,
      from,
      to
    );
    if (stats === null) {
      logger.info(`Aucune donnée pour calculer la moyenne de ${location}`);
        return null;
    }
    return stats.mean;
   } catch (error) {
     logger.error(
       "Erreur lors du calcul de la moyenne des données météorologiques:",
       error
     );
     throw error;
   }
  }

  async getMax(location: string, options: WeatherFilter) {
    const { from, to } = options;

    try{
      const stats = await this.weatherRepository.getTemperatureStats(
        location,
        from,
        to
      );
      if (stats === null) {
        logger.info(`Aucune donnée pour calculer le maximum de ${location}`);
          return null;
      }
      return stats.max;
    }catch(error){
      logger.error(
        "Erreur lors du calcul du maximum des données météorologiques:"
      );
      throw error;
    }
  }
 /**
   * OPTIMISÉ: Calcule le minimum via SQL
   */
  async getMin(location: string, options: WeatherFilter) {
    const { from, to } = options;
    try {
      const stats = await this.weatherRepository.getTemperatureStats(
        location,
        from,
        to
      );
      if (stats === null) {
        logger.info(`Aucune donnée pour calculer le minimum de ${location}`);
          return null;
      }
      return stats.min;
    } catch (error) {
      logger.error(
        "Erreur lors du calcul du minimum des données météorologiques:"
      );
      throw error;
    }
  }

  /**
   * BONUS: Récupère toutes les statistiques en une seule fois
   * À utiliser quand le client a besoin de mean, min et max simultanément
   */
  async getAllStats(
    location: string,
    options: WeatherFilter
  ): Promise<{ mean: number; max: number; min: number } | null> {
    const { from, to } = options;

    try {
      const stats = await this.weatherRepository.getTemperatureStats(location, from, to);

      if (stats === null) {
        logger.info(`Aucune donnée pour calculer les statistiques de ${location}`);
        return null;
      }

      return stats;
    } catch (error) {
      logger.error('Erreur dans WeatherService.getAllStats:', error);
      throw error;
    }
  }
}


export default new WeatherService();
