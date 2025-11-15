import pg from "pg";
import config from "config";
import { WeatherData, WeatherDataSchema } from "./dto.js";
import logger from "../logger.js";

const poolConfig = config.get<pg.PoolConfig>("database");

export class WeatherDataRepository {
  private pool: pg.Pool;

  constructor() {
    this.pool = new pg.Pool(poolConfig);
  }

  // Méthode pour rajouter les index et créer la table si elle n'existe pas
  async createTable(): Promise<void> {
    const query = `
            CREATE TABLE IF NOT EXISTS weather (
                location VARCHAR(256),
                date DATE,
                temperature DECIMAL,
                humidity DECIMAL,
                PRIMARY KEY(location, date)
            )
            -- Index pour les requetes par date range
            CREATE INDEX IF NOT EXISTS idx_weather_location_date ON weather(location, date);

            -- Index pour les requetes analytiques sur la temperature
            CREATE INDEX IF NOT EXISTS idx_weather_date ON weather(date);

        `;
    await this.pool.query(query);
  }

  async insertWeatherData(weatherData: WeatherData): Promise<void> {
    const query = `
            INSERT INTO weather (location, date, temperature, humidity)
            VALUES ($1, $2, $3, $4)
        `;

    const values = [
      weatherData.location,
      weatherData.date,
      weatherData.temperature,
      weatherData.humidity,
    ];
    await this.pool.query(query, values);
  }

  // Méthode modifiée pour inclure les filtres de date
  async getWeatherDataByLocationAndDateRange(
    location: string,
    from?: Date,
    to?: Date
  ): Promise<WeatherData[] | null> {
    let query = `
    SELECT location, date, temperature, humidity 
    FROM weather 
    WHERE location = $1
  `;

    const values: any[] = [location];

    // Ajout du filtre "from" si présent
    if (from) {
      query += ` AND date >= $${values.length + 1}`;
      values.push(from);
    }

    // Ajout du filtre "to" si présent
    if (to) {
      query += ` AND date <= $${values.length + 1}`;
      values.push(to);
    }

    // Tri par date croissante
    query += ` ORDER BY date ASC`;

    try {
      const result: pg.QueryResult = await this.pool.query(query, values);

      // Si aucun résultat, retourner null
      if (result.rows.length === 0) {
        return null;
      }

      // Parser et valider chaque ligne avec Zod
      return result.rows.map((row) => WeatherDataSchema.parse(row));
    } catch (error) {
      logger.error("Erreur lors de la récupération des données météo:", error);
      throw error;
    }
  }

// Nouvelle méthode pour obtenir les statistiques de température
  async getTemperatureStats(
    location: string,
    from?: Date,
    to?: Date
  ): Promise<{ mean: number; max: number; min: number } | null> {
    let query = `
                SELECT
                AVG(temperature) as mean,
                MAX(temperature) as max,
                MIN(temperature) as min
                FROM weather
                WHERE location = $1
                `;
    const values: any[] = [location];
    if (from) {
      query += ` AND date >= $${values.length + 1}`;
      values.push(from);
    }
    if (to) {
      query += ` AND date <= $${values.length + 1}`;
      values.push(to);
    }
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0 || result.rows[0].mean === null) {
      return null;
    }
    return {
      mean: parseFloat(result.rows[0].mean),
      max: parseFloat(result.rows[0].max),
      min: parseFloat(result.rows[0].min),
    };
  }
  
  async getAllWeatherData(): Promise<WeatherData[]> {
    const query = "SELECT location, date, temperature, humidity FROM weather";
    const result: pg.QueryResult = await this.pool.query(query);
    return result.rows as WeatherData[];
  }
}

export default new WeatherDataRepository();
