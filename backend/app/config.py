from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    parquet_path: str = "data/football_matches.parquet"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


settings = Settings()
