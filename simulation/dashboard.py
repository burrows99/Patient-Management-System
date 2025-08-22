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

class NHSTriageAnalytics:
    """Enhanced analytics for NHS triage system optimization"""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load and preprocess encounter data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            self.df['START_DT'] = pd.to_datetime(self.df['START'])
            self.df['STOP_DT'] = pd.to_datetime(self.df['STOP'])
            self.df['SERVICE_MIN'] = (self.df['STOP_DT'] - self.df['START_DT']).dt.total_seconds() / 60
            self.df['SERVICE_MIN'] = self.df['SERVICE_MIN'].clip(lower=1, upper=480)
            self.df['HOUR'] = self.df['START_DT'].dt.hour
            self.df['DAY_OF_WEEK'] = self.df['START_DT'].dt.day_name()
            self.df['MONTH'] = self.df['START_DT'].dt.month
            self.df['YEAR'] = self.df['START_DT'].dt.year
            print(f"✅ Loaded {len(self.df)} encounters successfully")
        except Exception as e:
            raise Exception(f"Failed to load data: {e}")
    
    def analyze_temporal_patterns(self):
        """Analyze temporal patterns for resource planning"""
        print("\n" + "="*60)
        print("📊 TEMPORAL PATTERN ANALYSIS")
        print("="*60)
        
        # Hourly distribution
        hourly_dist = self.df['HOUR'].value_counts().sort_index()
        peak_hour = hourly_dist.idxmax()
        
        # Weekly distribution
        weekly_dist = self.df['DAY_OF_WEEK'].value_counts()
        busiest_day = weekly_dist.idxmax()
        
        # Monthly seasonality
        monthly_dist = self.df['MONTH'].value_counts().sort_index()
        peak_month = monthly_dist.idxmax()
        
        print(f"⏰ Peak Hour: {peak_hour}:00 ({hourly_dist[peak_hour]} encounters)")
        print(f"📅 Busiest Day: {busiest_day} ({weekly_dist[busiest_day]} encounters)")
        print(f"🗓️  Peak Month: {peak_month} ({monthly_dist[peak_month]} encounters)")
        
        # Identify quiet periods for maintenance
        quiet_hours = hourly_dist.nsmallest(3)
        print(f"\n🔧 Recommended Maintenance Windows:")
        for hour, count in quiet_hours.items():
            print(f"   {hour:02d}:00-{hour+1:02d}:00 (avg {count/len(self.df['YEAR'].unique()):.1f} encounters/year)")
        
        return {
            'peak_hour': peak_hour,
            'busiest_day': busiest_day,
            'peak_month': peak_month,
            'hourly_distribution': hourly_dist.to_dict(),
            'weekly_distribution': weekly_dist.to_dict()
        }
    
    def analyze_service_patterns(self):
        """Analyze service time patterns by encounter type"""
        print("\n" + "="*60)
        print("⚕️  SERVICE PATTERN ANALYSIS")
        print("="*60)
        
        service_stats = self.df.groupby('ENCOUNTERCLASS')['SERVICE_MIN'].agg([
            'count', 'mean', 'median', 'std', 
            lambda x: x.quantile(0.95)
        ]).round(1)
        service_stats.columns = ['Count', 'Mean', 'Median', 'StdDev', 'P95']
        
        print(service_stats.to_string())
        
        # Identify bottlenecks
        print(f"\n🚨 BOTTLENECK ANALYSIS:")
        high_variance = service_stats[service_stats['StdDev'] > service_stats['StdDev'].median() * 1.5]
        long_tail = service_stats[service_stats['P95'] > service_stats['P95'].median() * 1.5]
        
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
        print("\n" + "="*60)
        print("🏥 CAPACITY PLANNING RECOMMENDATIONS")
        print("="*60)
        
        # Recent trend analysis (last 5 years)
        recent_years = self.df[self.df['YEAR'] >= 2020]
        if len(recent_years) > 0:
            yearly_growth = recent_years.groupby('YEAR').size()
            if len(yearly_growth) > 1:
                growth_rate = (yearly_growth.iloc[-1] - yearly_growth.iloc[0]) / len(yearly_growth) / yearly_growth.iloc[0] * 100
                print(f"📈 Recent Growth Rate: {growth_rate:.1f}% per year")
                
                # Project future demand
                current_annual = yearly_growth.iloc[-1] if len(yearly_growth) > 0 else len(recent_years)
                projected_1yr = current_annual * (1 + growth_rate/100)
                projected_3yr = current_annual * ((1 + growth_rate/100) ** 3)
                
                print(f"🔮 DEMAND PROJECTIONS:")
                print(f"   Current Annual: {current_annual:,.0f} encounters")
                print(f"   1-Year Projection: {projected_1yr:,.0f} encounters")
                print(f"   3-Year Projection: {projected_3yr:,.0f} encounters")
        
        # Peak capacity requirements
        daily_max = self.df.groupby(self.df['START_DT'].dt.date).size().max()
        hourly_max = self.df.groupby([self.df['START_DT'].dt.date, self.df['START_DT'].dt.hour]).size().max()
        
        print(f"\n🎯 PEAK CAPACITY REQUIREMENTS:")
        print(f"   Max Daily Volume: {daily_max} encounters")
        print(f"   Max Hourly Volume: {hourly_max} encounters")
        
        # Server recommendations based on queue theory
        avg_service_time = self.df['SERVICE_MIN'].mean()
        peak_arrival_rate = hourly_max / 60  # patients per minute
        
        # M/M/c queue approximation for server requirements
        utilization_target = 0.80  # 80% utilization target
        min_servers = max(1, int(np.ceil(peak_arrival_rate * avg_service_time / utilization_target)))
        recommended_servers = min_servers + 1  # Add buffer
        
        print(f"\n👥 STAFFING RECOMMENDATIONS:")
        print(f"   Minimum Servers (80% util): {min_servers}")
        print(f"   Recommended Servers: {recommended_servers}")
        print(f"   Peak Period Buffer: +{max(1, int(recommended_servers * 0.3))} additional staff")
        
        return {
            'daily_max': daily_max,
            'hourly_max': hourly_max,
            'recommended_servers': recommended_servers,
            'avg_service_time': avg_service_time
        }
    
    def priority_mapping_analysis(self):
        """Analyze encounter types for MTS priority mapping optimization"""
        print("\n" + "="*60)
        print("🚨 MANCHESTER TRIAGE PRIORITY OPTIMIZATION")
        print("="*60)
        
        # Analyze service times by encounter class for priority calibration
        encounter_analysis = self.df.groupby('ENCOUNTERCLASS').agg({
            'SERVICE_MIN': ['count', 'mean', 'std'],
            'REASONDESCRIPTION': lambda x: x.str.contains('emergency|urgent|acute|pain|bleeding', 
                                                        case=False, na=False).sum()
        }).round(2)
        
        encounter_analysis.columns = ['Count', 'Avg_Service', 'Service_StdDev', 'Urgent_Keywords']
        encounter_analysis['Urgent_Ratio'] = (encounter_analysis['Urgent_Keywords'] / 
                                            encounter_analysis['Count']).round(3)
        
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
        print("\n" + "="*60)
        print("⚙️  SIMULATION OPTIMIZATION RECOMMENDATIONS")
        print("="*60)
        
        # Find optimal simulation windows
        self.df['DATE'] = self.df['START_DT'].dt.date
        daily_counts = self.df['DATE'].value_counts()
        busy_days = daily_counts[daily_counts > 2]
        
        if len(busy_days) > 0:
            optimal_date = busy_days.index[0]
            optimal_count = busy_days.iloc[0]
            
            # Get encounters for that day
            day_encounters = self.df[self.df['DATE'] == optimal_date]
            time_span = (day_encounters['START_DT'].max() - 
                        day_encounters['START_DT'].min()).total_seconds() / 3600
            
            print(f"📅 OPTIMAL SIMULATION DATE: {optimal_date}")
            print(f"   Encounters: {optimal_count}")
            print(f"   Time Span: {time_span:.1f} hours")
            
            # Encounter type distribution for that day
            type_dist = day_encounters['ENCOUNTERCLASS'].value_counts()
            print(f"   Distribution: {dict(type_dist)}")
            
            # Compression recommendations
            if time_span > 8:
                compression_factor = time_span / 8
                print(f"\n⚡ COMPRESSION RECOMMENDATIONS:")
                print(f"   Original span: {time_span:.1f} hours")
                print(f"   Recommended compression: --compressTo=8hours")
                print(f"   Compression factor: {compression_factor:.2f}x")
            
            # Server recommendations based on queue theory
            avg_service = day_encounters['SERVICE_MIN'].mean()
            max_concurrent = min(optimal_count, max(1, int(optimal_count * avg_service / (time_span * 60))))
            
            print(f"\n👥 SIMULATION SERVER RECOMMENDATIONS:")
            print(f"   Minimum servers: {max(1, max_concurrent)}")
            print(f"   Recommended servers: {max(2, max_concurrent + 1)}")
            print(f"   Stress test servers: {max(1, max_concurrent - 1)}")
        
        # Generate simulation commands
        print(f"\n🚀 READY-TO-USE SIMULATION COMMANDS:")
        print(f"   # Standard simulation")
        print(f"   python compressed_mts_simulation.py --servers=3 --compressTo=8hours --limit=100")
        print(f"   # Emergency-only simulation")
        print(f"   python compressed_mts_simulation.py --servers=2 --class=emergency --compressTo=4hours")
        print(f"   # High-capacity stress test")
        print(f"   python compressed_mts_simulation.py --servers=6 --limit=200 --compressTo=12hours")
        
        return {
            'optimal_date': optimal_date if len(busy_days) > 0 else None,
            'busy_day_count': len(busy_days),
            'recommended_servers': max(2, max_concurrent + 1) if len(busy_days) > 0 else 3
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
        summary_report = {
            'generated_at': datetime.now().isoformat(),
            'dataset_size': len(self.df),
            'date_range': {
                'start': str(self.df['YEAR'].min()),
                'end': str(self.df['YEAR'].max())
            },
            'key_metrics': {
                'peak_hour': temporal_analysis['peak_hour'],
                'busiest_day': temporal_analysis['busiest_day'],
                'recommended_servers': capacity_analysis['recommended_servers'],
                'daily_max_volume': capacity_analysis['daily_max'],
                'avg_service_time_min': round(capacity_analysis['avg_service_time'], 1)
            },
            'recommendations': {
                'optimal_simulation_date': str(simulation_recommendations.get('optimal_date', '')),
                'recommended_servers': simulation_recommendations['recommended_servers']
            }
        }
        
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
            json.dump(summary, f, indent=2)
        
        print(f"\n💾 Summary report saved: {output_path}")
        print("\n✅ Analysis complete! Use the recommendations above to optimize your triage system.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()