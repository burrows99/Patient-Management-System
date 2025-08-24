#!/usr/bin/env python3
"""
Compare MTA and Ollama-based triage systems.

This script runs the simulation with both triage systems and compares their results.
"""

import json
import time
import logging
import matplotlib.pyplot as plt
from datetime import datetime
from pathlib import Path
from typing import Dict
import sys

# Ensure project root is on sys.path when running as a script
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from simulation.simulation import run_simulation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('triage_comparison.log')
    ]
)
logger = logging.getLogger(__name__)

class TriageComparison:
    """Class to compare different triage systems."""
    
    def __init__(self, output_dir: str = "output/comparison"):
        """Initialize the comparison with output directory."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = {}
        
    def run_simulation_with_system(self, system_type: str, **kwargs) -> Dict:
        """Run simulation with a specific triage system."""
        logger.info(f"Running simulation with {system_type.upper()} triage system...")
        
        # Add system-specific parameters
        params = {
            "triage_system": system_type,
            "debug": True,
            **kwargs
        }
        
        # Ensure Ollama does not silently fall back to MTS during comparisons
        if system_type == "ollama":
            params["disable_fallback"] = True
        
        # Time the simulation
        start_time = time.time()
        results = run_simulation(**params)
        duration = time.time() - start_time
        
        # Store results
        self.results[system_type] = {
            "params": params,
            "results": results,
            "duration_seconds": duration
        }
        
        logger.info(f"{system_type.upper()} simulation completed in {duration:.2f} seconds")
        return results
    
    def compare_systems(self):
        """Run both systems and compare results."""
        # Run MTA (Manchester Triage Algorithm)
        self.run_simulation_with_system("mta")
        
        # Run Ollama-based triage
        self.run_simulation_with_system("ollama", ollama_model="mistral:7b-instruct")
        
        # Generate comparison report
        comparison = self._generate_comparison_report()
        
        # Save results
        self._save_results(comparison)
        
        return comparison
    
    def _generate_comparison_report(self) -> Dict:
        """Generate a comparison report between the two systems."""
        if len(self.results) < 2:
            logger.warning("Need at least two systems to compare")
            return {}
            
        report = {
            "timestamp": datetime.now().isoformat(),
            "comparisons": {}
        }
        
        # Get system names
        systems = list(self.results.keys())
        
        # Compare each metric
        metrics = ["total_patients", "avg_wait_time", "breach_rate"]
        
        for metric in metrics:
            report["comparisons"][metric] = {}
            for system in systems:
                report["comparisons"][metric][system] = self._extract_metric(system, metric)
        
        # Add timing information
        report["durations"] = {
            system: self.results[system]["duration_seconds"]
            for system in systems
        }
        
        return report
    
    def _extract_metric(self, system: str, metric: str) -> float:
        """Extract a specific metric from the simulation results."""
        results = self.results[system].get("results", {})
        perf = results.get("system_performance", {})

        if metric == "total_patients":
            return int(perf.get("total_patients", 0))
        elif metric == "avg_wait_time":
            # overall average wait in minutes
            return float(perf.get("overall_avg_wait_min", 0.0))
        elif metric == "breach_rate":
            # convert percent to fraction because plotting multiplies by 100 later
            return float(perf.get("overall_breach_rate_percent", 0.0)) / 100.0
        return 0.0
    
    def _save_results(self, comparison: Dict):
        """Save comparison results to files."""
        # Save raw results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save comparison report
        with open(self.output_dir / f"comparison_{timestamp}.json", "w") as f:
            json.dump(comparison, f, indent=2)
        
        # Save individual results
        for system, data in self.results.items():
            with open(self.output_dir / f"{system}_results_{timestamp}.json", "w") as f:
                json.dump(data, f, indent=2)
        
        # Generate and save plots
        self._generate_plots(comparison, timestamp)
    
    def _generate_plots(self, comparison: Dict, timestamp: str):
        """Generate comparison plots."""
        # Create DataFrames for plotting
        metrics = comparison.get("comparisons", {})
        systems = list(metrics.get("total_patients", {}).keys())
        
        if not systems:
            return
        
        # Plot metrics
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        
        # Total patients
        axes[0].bar(systems, [metrics["total_patients"][s] for s in systems])
        axes[0].set_title("Total Patients Processed")
        axes[0].set_ylabel("Count")
        
        # Average wait time
        axes[1].bar(systems, [metrics["avg_wait_time"][s] for s in systems])
        axes[1].set_title("Average Wait Time (min)")
        axes[1].set_ylabel("Minutes")
        
        # Breach rate
        axes[2].bar(systems, [metrics["breach_rate"][s] * 100 for s in systems])
        axes[2].set_title("Breach Rate (%)")
        axes[2].set_ylabel("Percentage")
        
        # Save figure
        plt.tight_layout()
        plt.savefig(self.output_dir / f"comparison_{timestamp}.png")
        plt.close()


def main():
    """Main function to run the comparison."""
    logger.info("Starting triage system comparison...")
    
    # Create comparison instance
    comparison = TriageComparison()
    
    try:
        # Run comparisons
        results = comparison.compare_systems()
        
        # Print summary
        logger.info("\n===== COMPARISON SUMMARY =====")
        logger.info(f"Comparison completed at: {results.get('timestamp')}")
        
        for metric, values in results.get("comparisons", {}).items():
            logger.info(f"\n{metric.replace('_', ' ').title()}:")
            for system, value in values.items():
                logger.info(f"  {system.upper()}: {value:.2f}")
        
        logger.info("\nSimulation Durations:")
        for system, duration in results.get("durations", {}).items():
            logger.info(f"  {system.upper()}: {duration:.2f} seconds")
        
        logger.info("\nDetailed results saved to the output directory.")
        
    except Exception as e:
        logger.error(f"Error during comparison: {e}", exc_info=True)
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
