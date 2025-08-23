#!/usr/bin/env python3
"""
Enhanced NHS MOA Triage System Analytics Dashboard
Provides comprehensive analysis and recommendations for healthcare resource planning
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from pathlib import Path
import json
import warnings
warnings.filterwarnings('ignore')
from simulation.utils.data_utils import load_encounters_df
from simulation.utils.analytics import (
    temporal_patterns,
    service_patterns,
    capacity_planning,
    priority_mapping,
    simulation_optimization,
    detect_bottlenecks,
)
from simulation.utils.format_utils import print_section, NpEncoder, print_sim_commands
from simulation.utils.reporting import build_summary_report

 

class NHSTriageAnalytics:
    """Enhanced analytics for NHS triage system optimization"""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load and preprocess encounter data using shared utilities"""
        try:
            # Determine output directory and load encounters with standardized columns/features
            # If csv_path is .../output/csv/encounters.csv then parent.parent is .../output
            output_dir = Path(self.csv_path).parent.parent
            self.df = load_encounters_df(output_dir)
            print(f"✅ Loaded {len(self.df)} encounters successfully")
        except Exception as e:
            raise Exception(f"Failed to load data: {e}")
    
    def analyze_temporal_patterns(self):
        """Analyze temporal patterns for resource planning"""
        print_section("📊 TEMPORAL PATTERN ANALYSIS")
        
        tp = temporal_patterns(self.df)
        hourly_dist = tp['hourly_distribution']
        weekly_dist = tp['weekly_distribution']
        monthly_dist = tp['monthly_distribution']
        peak_hour = tp['peak_hour']
        busiest_day = tp['busiest_day']
        peak_month = tp['peak_month']

        print(f"⏰ Peak Hour: {peak_hour}:00 ({hourly_dist.get(peak_hour, 0)} encounters)")
        print(f"📅 Busiest Day: {busiest_day} ({weekly_dist.get(busiest_day, 0)} encounters)")
        print(f"🗓️  Peak Month: {peak_month} ({monthly_dist.get(peak_month, 0)} encounters)")
        
        # Identify quiet periods for maintenance
        quiet_hours = hourly_dist.nsmallest(3)
        print(f"\n🔧 Recommended Maintenance Windows:")
        for hour, count in quiet_hours.items():
            print(f"   {hour:02d}:00-{hour+1:02d}:00 (avg {count/len(self.df['YEAR'].unique()):.1f} encounters/year)")
        
        return {
            'peak_hour': peak_hour,
            'busiest_day': busiest_day,
            'peak_month': peak_month,
            'hourly_distribution': dict(hourly_dist),
            'weekly_distribution': dict(weekly_dist)
        }
    
    def analyze_service_patterns(self):
        """Analyze service time patterns by encounter type"""
        print_section("⚕️  SERVICE PATTERN ANALYSIS")
        
        service_stats = service_patterns(self.df)
        
        print(service_stats.to_string())
        
        # Identify bottlenecks
        print(f"\n🚨 BOTTLENECK ANALYSIS:")
        bottlenecks = detect_bottlenecks(service_stats)
        high_variance = bottlenecks['high_variance']
        long_tail = bottlenecks['long_tail']
        if not high_variance.empty:
            print(f"   High Variance Encounters (unpredictable duration):")
            for enc_type in high_variance.index:
                print(f"     • {enc_type}: {high_variance.loc[enc_type, 'StdDev']:.1f}min std dev")
        if not long_tail.empty:
            print(f"   Long-Tail Encounters (95th percentile > median):")
            for enc_type in long_tail.index:
                print(f"     • {enc_type}: {long_tail.loc[enc_type, 'P95']:.1f}min (95th percentile)")
        
        return service_stats
    
    def capacity_planning_analysis(self):
        """Provide capacity planning recommendations"""
        print_section("🏥 CAPACITY PLANNING RECOMMENDATIONS")
        
        cap = capacity_planning(self.df)

        if cap.get('growth_rate') is not None:
            print(f"📈 Recent Growth Rate: {cap['growth_rate']:.1f}% per year")
            print(f"🔮 DEMAND PROJECTIONS:")
            print(f"   Current Annual: {cap['current_annual']:,} encounters")
            print(f"   1-Year Projection: {cap['projected_1yr']:.0f} encounters")
            print(f"   3-Year Projection: {cap['projected_3yr']:.0f} encounters")

        print(f"\n🎯 PEAK CAPACITY REQUIREMENTS:")
        print(f"   Max Daily Volume: {cap['daily_max']} encounters")
        print(f"   Max Hourly Volume: {cap['hourly_max']} encounters")

        print(f"\n👥 STAFFING RECOMMENDATIONS:")
        print(f"   Minimum Servers (80% util): {cap['min_servers']}")
        print(f"   Recommended Servers: {cap['recommended_servers']}")
        print(f"   Peak Period Buffer: +{max(1, int(cap['recommended_servers'] * 0.3))} additional staff")

        return {
            'daily_max': cap['daily_max'],
            'hourly_max': cap['hourly_max'],
            'recommended_servers': cap['recommended_servers'],
            'avg_service_time': cap['avg_service_time']
        }
    
    def priority_mapping_analysis(self):
        """Analyze encounter types for MTS priority mapping optimization"""
        print_section("🚨 MANCHESTER TRIAGE PRIORITY OPTIMIZATION")
        
        # Analyze service times by encounter class for priority calibration
        encounter_analysis = priority_mapping(self.df)
        
        print("ENCOUNTER TYPE ANALYSIS FOR MTS MAPPING:")
        print(encounter_analysis.to_string())
        
        # Recommend priority distributions
        print(f"\n📋 RECOMMENDED MTS PRIORITY DISTRIBUTIONS:")
        priority_recommendations = {
            'emergency': "P1 (20%), P2 (50%), P3 (30%)",
            'urgentcare': "P2 (30%), P3 (50%), P4 (20%)",
            'ambulatory': "P3 (30%), P4 (50%), P5 (20%)",
            'outpatient': "P3 (20%), P4 (60%), P5 (20%)",
            'wellness': "P4 (40%), P5 (60%)",
            'inpatient': "P2 (20%), P3 (60%), P4 (20%)"
        }
        
        for enc_type, recommendation in priority_recommendations.items():
            if enc_type in encounter_analysis.index:
                count = encounter_analysis.loc[enc_type, 'Count']
                print(f"   {enc_type}: {recommendation} ({count} encounters)")
        
        return encounter_analysis
    
    def simulation_optimization_recommendations(self):
        """Provide optimized simulation parameters"""
        print_section("⚙️  SIMULATION OPTIMIZATION RECOMMENDATIONS")
        
        # Find optimal simulation windows
        sim = simulation_optimization(self.df)

        if sim.get('optimal_date') is not None:
            optimal_date = sim['optimal_date']
            time_span = sim.get('time_span_hours', 0.0)
            print(f"📅 OPTIMAL SIMULATION DATE: {optimal_date}")
            print(f"   Encounters: {sim.get('optimal_count', 0)}")
            print(f"   Time Span: {time_span:.1f} hours")
            print(f"   Distribution: {sim.get('type_distribution', {})}")

            if time_span > 8:
                compression_factor = time_span / 8
                print(f"\n⚡ COMPRESSION RECOMMENDATIONS:")
                print(f"   Original span: {time_span:.1f} hours")
                print(f"   Recommended compression: --compressTo=8hours")
                print(f"   Compression factor: {compression_factor:.2f}x")

            print(f"\n👥 SIMULATION SERVER RECOMMENDATIONS:")
            print(f"   Minimum servers: {sim.get('min_servers', 1)}")
            print(f"   Recommended servers: {sim.get('recommended_servers', 2)}")
            print(f"   Stress test servers: {sim.get('stress_test_servers', 1)}")

        # Generate simulation commands via utility
        print_sim_commands()

        return {
            'optimal_date': sim.get('optimal_date'),
            'recommended_servers': sim.get('recommended_servers')
        }
    
    def generate_comprehensive_report(self):
        """Generate comprehensive analytics report"""
        print("\n" + "="*80)
        print("🏥 NHS MOA TRIAGE SYSTEM - COMPREHENSIVE ANALYTICS REPORT")
        print("="*80)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Dataset: {len(self.df)} encounters ({self.df['YEAR'].min()}-{self.df['YEAR'].max()})")
        
        # Run all analyses
        temporal_analysis = self.analyze_temporal_patterns()
        service_analysis = self.analyze_service_patterns()
        capacity_analysis = self.capacity_planning_analysis()
        priority_analysis = self.priority_mapping_analysis()
        simulation_recommendations = self.simulation_optimization_recommendations()
        
        # Summary recommendations
        print("\n" + "="*60)
        print("📋 EXECUTIVE SUMMARY & ACTION ITEMS")
        print("="*60)
        
        print("🎯 IMMEDIATE ACTIONS:")
        print("   1. Implement peak-hour staffing adjustments")
        print("   2. Review emergency encounter priority mapping")
        print("   3. Set up automated capacity monitoring")
        
        print("\n🔧 SYSTEM OPTIMIZATIONS:")
        print("   1. Schedule maintenance during identified quiet periods")
        print("   2. Implement predictive staffing based on temporal patterns")
        print("   3. Set up alerts for high-variance encounter types")
        
        print("\n📊 MONITORING RECOMMENDATIONS:")
        print("   1. Track monthly encounter volume trends")
        print("   2. Monitor P95 wait times by priority level")
        print("   3. Measure staffing efficiency during peak periods")
        
        # Generate summary JSON for external systems
        summary_report = build_summary_report(
            self.df, temporal_analysis, capacity_analysis, simulation_recommendations
        )
        
        return summary_report

def main():
    """Main execution function"""
    try:
        # Initialize analytics
        script_dir = Path(__file__).parent
        csv_path = script_dir.parent / 'output' / 'csv' / 'encounters.csv'
        
        if not csv_path.exists():
            print(f"❌ CSV file not found: {csv_path}")
            return
        
        analytics = NHSTriageAnalytics(str(csv_path))
        
        # Generate comprehensive report
        summary = analytics.generate_comprehensive_report()
        
        # Save summary report
        output_path = script_dir.parent / 'analytics_summary.json'
        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2, cls=NpEncoder)
        
        print(f"\n💾 Summary report saved: {output_path}")
        print("\n✅ Analysis complete! Use the recommendations above to optimize your triage system.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()