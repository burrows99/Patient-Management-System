import React, { useState } from 'react';
import NhsButton from '../components/common/button/NhsButton';
import PageLayout from '../components/common/PageLayout';
import DatasetsContent from '../components/common/text/DatasetsContent';
import MethodologyContent from '../components/common/text/MethodologyContent';
import BaselineContent from '../components/common/text/BaselineContent';

const TriageSimulatorDescriptionPage = () => {
  const [tab, setTab] = useState('datasets'); // datasets | methodology | baseline
  return (
    <PageLayout
      title="Triage Simulator"
      lead="We use a synthetic dataset (Synthea UK module) for prototyping. Real data integrations can follow later."
      actions={<NhsButton to="/triage-simulator">Go to Triage Simulator</NhsButton>}
    >
      {/* Tabs header using NHS.UK pattern */}
      <div className="nhsuk-tabs" data-module="nhsuk-tabs">
        <h2 className="nhsuk-tabs__title">Contents</h2>
        <ul className="nhsuk-tabs__list" role="tablist">
          <li className="nhsuk-tabs__list-item" role="presentation">
            <a
              id="tab-datasets-tab"
              href="#tab-datasets"
              className={`nhsuk-tabs__tab${tab === 'datasets' ? ' nhsuk-tabs__tab--selected' : ''}`}
              role="tab"
              aria-controls="tab-datasets"
              aria-selected={tab === 'datasets'}
              onClick={(e) => { e.preventDefault(); setTab('datasets'); }}
            >
              Available datasets
            </a>
          </li>
          <li className="nhsuk-tabs__list-item" role="presentation">
            <a
              id="tab-methodology-tab"
              href="#tab-methodology"
              className={`nhsuk-tabs__tab${tab === 'methodology' ? ' nhsuk-tabs__tab--selected' : ''}`}
              role="tab"
              aria-controls="tab-methodology"
              aria-selected={tab === 'methodology'}
              onClick={(e) => { e.preventDefault(); setTab('methodology'); }}
            >
              Methodology
            </a>
          </li>
          <li className="nhsuk-tabs__list-item" role="presentation">
            <a
              id="tab-baseline-tab"
              href="#tab-baseline"
              className={`nhsuk-tabs__tab${tab === 'baseline' ? ' nhsuk-tabs__tab--selected' : ''}`}
              role="tab"
              aria-controls="tab-baseline"
              aria-selected={tab === 'baseline'}
              onClick={(e) => { e.preventDefault(); setTab('baseline'); }}
            >
              Current triage methodologies
            </a>
          </li>
        </ul>
      </div>

      {/* Panels using NHS.UK panel classes */}
      <section
        id="tab-datasets"
        className={`nhsuk-tabs__panel${tab === 'datasets' ? '' : ' nhsuk-tabs__panel--hidden'}`}
        role="tabpanel"
        aria-labelledby="tab-datasets-tab"
        aria-hidden={tab !== 'datasets'}
        hidden={tab !== 'datasets'}
      >
        <DatasetsContent />
      </section>

      <section
        id="tab-methodology"
        className={`nhsuk-tabs__panel${tab === 'methodology' ? '' : ' nhsuk-tabs__panel--hidden'}`}
        role="tabpanel"
        aria-labelledby="tab-methodology-tab"
        aria-hidden={tab !== 'methodology'}
        hidden={tab !== 'methodology'}
      >
        <MethodologyContent />
      </section>

      <section
        id="tab-baseline"
        className={`nhsuk-tabs__panel${tab === 'baseline' ? '' : ' nhsuk-tabs__panel--hidden'}`}
        role="tabpanel"
        aria-labelledby="tab-baseline-tab"
        aria-hidden={tab !== 'baseline'}
        hidden={tab !== 'baseline'}
      >
        <BaselineContent />
      </section>

    </PageLayout>
  );
};

export default TriageSimulatorDescriptionPage;
