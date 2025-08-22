"""
Modular data loading utilities for NHS MOA Triage System.
Supports CSV and Excel sources and provides per-entity loaders.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional, Dict
import pandas as pd
import numpy as np


class DataLoader:
    """Convenience loader for entities under output/csv or Excel fallbacks.

    Default directory layout:
      - output/csv/encounters.csv
      - output/csv/patients.csv (optional)
      - output/csv/providers.csv (optional)
      - output/csv/payers.csv (optional)

    Excel fallback (if CSV not found):
      - output/excel/data.xlsx with sheets: Encounters, Patients, Providers, Payers
    """

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.csv_dir = self.output_dir / "csv"
        self.excel_dir = self.output_dir / "excel"

    # --------------- Generic readers ---------------
    def _read_csv_or_excel(self, csv_name: str, excel_sheet: str) -> pd.DataFrame:
        csv_path = self.csv_dir / csv_name
        if csv_path.exists():
            return pd.read_csv(csv_path)

        # Excel fallback
        xlsx_path = self.excel_dir / "data.xlsx"
        if xlsx_path.exists():
            return pd.read_excel(xlsx_path, sheet_name=excel_sheet)

        raise FileNotFoundError(
            f"Neither {csv_path} nor {xlsx_path} (sheet '{excel_sheet}') found"
        )

    # --------------- Entity-specific loaders ---------------
    def load_encounters(self) -> pd.DataFrame:
        """Load and preprocess encounters with time features.

        Returns a DataFrame with parsed times and helper columns:
        - START_DT, STOP_DT, SERVICE_MIN (clipped to [1,480])
        - HOUR, DAY_OF_WEEK, MONTH, YEAR
        """
        df = self._read_csv_or_excel("encounters.csv", "Encounters")

        # Parse times if present
        if "START" in df.columns:
            df["START_DT"] = pd.to_datetime(df["START"], errors="coerce")
        if "STOP" in df.columns:
            df["STOP_DT"] = pd.to_datetime(df["STOP"], errors="coerce")

        # Service minutes (fallback to 1 if missing/invalid)
        if "START_DT" in df.columns and "STOP_DT" in df.columns:
            svc = (df["STOP_DT"] - df["START_DT"]).dt.total_seconds() / 60
            df["SERVICE_MIN"] = np.clip(svc.fillna(0), 1, 480)
        elif "SERVICE_MIN" not in df.columns:
            df["SERVICE_MIN"] = 15.0

        # Time features (safe defaults if START_DT missing)
        if "START_DT" in df.columns:
            df["HOUR"] = df["START_DT"].dt.hour
            df["DAY_OF_WEEK"] = df["START_DT"].dt.day_name()
            df["MONTH"] = df["START_DT"].dt.month
            df["YEAR"] = df["START_DT"].dt.year
        else:
            df["HOUR"] = 0
            df["DAY_OF_WEEK"] = "Monday"
            df["MONTH"] = 1
            df["YEAR"] = 1970

        return df

    def load_patients(self) -> pd.DataFrame:
        return self._read_csv_or_excel("patients.csv", "Patients")

    def load_providers(self) -> pd.DataFrame:
        return self._read_csv_or_excel("providers.csv", "Providers")

    def load_payers(self) -> pd.DataFrame:
        return self._read_csv_or_excel("payers.csv", "Payers")

    def load_observations(self) -> pd.DataFrame:
        return self._read_csv_or_excel("observations.csv", "Observations")
