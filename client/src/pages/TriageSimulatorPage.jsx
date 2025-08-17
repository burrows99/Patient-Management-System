import React from 'react';
import TriageSimulator from '../features/triage/components/TriageSimulator';
import PageLayout from '../components/common/PageLayout';

const TriageSimulatorPage = () => {
  return (
    <PageLayout
      title="Triage Simulator"
      lead="Simulate triage outcomes using configurable parameters."
    >
      <TriageSimulator />
    </PageLayout>
  );
};

export default TriageSimulatorPage;
