from __future__ import annotations
from pathlib import Path
from typing import Any, Dict
import json
import yaml
import pandas as pd


def read_yaml(path: str | Path) -> Dict[str, Any]:
    p = Path(path)
    with p.open("r") as f:
        return yaml.safe_load(f) or {}


def write_yaml(path: str | Path, data: Dict[str, Any]) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w") as f:
        yaml.safe_dump(data, f, sort_keys=False)


def read_json(path: str | Path) -> Any:
    p = Path(path)
    with p.open("r") as f:
        return json.load(f)


def write_json(path: str | Path, data: Any, indent: int = 2) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w") as f:
        json.dump(data, f, indent=indent)


def read_csv(path: str | Path, **kwargs) -> pd.DataFrame:
    return pd.read_csv(path, **kwargs)


def write_csv(df: pd.DataFrame, path: str | Path, index: bool = False, **kwargs) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(p, index=index, **kwargs)


def read_csv_or_excel(base_dir: str | Path, csv_name: str, excel_sheet: str) -> pd.DataFrame:
    """Read from output/csv/<csv_name> or fallback to output/excel/data.xlsx <sheet>.
    base_dir should be the 'output/' directory. Raises FileNotFoundError if neither is available.
    """
    base = Path(base_dir)
    csv_path = base / "csv" / csv_name
    if csv_path.exists():
        return pd.read_csv(csv_path)

    xlsx_path = base / "excel" / "data.xlsx"
    if xlsx_path.exists():
        return pd.read_excel(xlsx_path, sheet_name=excel_sheet)

    raise FileNotFoundError(
        f"Neither {csv_path} nor {xlsx_path} (sheet '{excel_sheet}') found"
    )
