import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSun, Sun, Wind, Droplets } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface DestinationWeatherCardProps {
  destination: string;
  lat?: number;
  lng?: number;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

function getWeatherInfo(code: number): { text: string; icon: any } {
  if (code === 0) return { text: "Clear Sky", icon: Sun };
  if (code >= 1 && code <= 3) return { text: "Partly Cloudy", icon: CloudSun };
  if (code >= 45 && code <= 48) return { text: "Foggy", icon: Cloud };
  if (code >= 51 && code <= 67) return { text: "Rain Showers", icon: CloudRain };
  if (code >= 80 && code <= 82) return { text: "Heavy Rain", icon: CloudRain };
  if (code >= 95) return { text: "Thunderstorm", icon: CloudRain };
  return { text: "Fair Weather", icon: CloudSun };
}

// Global in-memory cache (15 minutes TTL) for instantaneous response
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export function DestinationWeatherCard({ destination, lat = 17.385, lng = 78.4867 }: DestinationWeatherCardProps) {
  const { t } = useTranslation();
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

  const cached = weatherCache.get(cacheKey);
  const isCacheValid = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

  const [weather, setWeather] = useState<WeatherData | null>(() => (isCacheValid ? cached.data : null));
  const [loading, setLoading] = useState(!isCacheValid);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isCacheValid) return;

    let active = true;

    async function fetchWeather() {
      try {
        setLoading(true);
        setError(false);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather request failed");
        const data = await res.json();
        if (active && data.current) {
          const result: WeatherData = {
            temperature: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            weatherCode: data.current.weather_code,
          };
          weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
          setWeather(result);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchWeather();
    return () => {
      active = false;
    };
  }, [cacheKey, isCacheValid, lat, lng]);

  if (loading && !weather) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded-full" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <div className="h-7 w-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cloud className="h-4 w-4" />
          <span className="font-semibold text-foreground">{destination}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{t("weatherUnavailable")}</p>
      </div>
    );
  }

  const { text, icon: IconComponent } = getWeatherInfo(weather.weatherCode);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t("weatherTitle")}
          </span>
          <h4 className="text-sm font-bold text-foreground mt-0.5">{destination}</h4>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
          <IconComponent className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-foreground">{weather.temperature}°C</span>
          <span className="ml-2 text-xs font-semibold text-muted-foreground">{text}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/60 pt-2.5">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3.5 w-3.5 text-blue-500" />
          <span>{weather.humidity}% {t("humidity")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-teal-500" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}
