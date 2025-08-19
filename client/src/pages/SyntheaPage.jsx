import React, { useMemo, useCallback } from 'react';
import PageLayout from '../components/common/PageLayout';
import NhsTable from '../components/common/NhsTable';
import useSynthea from '../components/features/synthea/useSynthea';
import SyntheaControls from '../components/features/synthea/SyntheaControls';
import SyntheaHapiNotes from '../components/common/text/SyntheaHapiNotes';

// NHS-styled page to trigger Synthea generation, fetch patients, and render as table
export default function SyntheaPage() {
  const {
    loading,
    params,
    patients,
    setParam,
    onGenerate,
    onFetch,
  } = useSynthea({ p: 5, n: 25 });

  const openRowJson = useCallback((row) => {
    try {
      const key = `synthea-row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(key, JSON.stringify(row));
      const target = `/synthea/json?key=${encodeURIComponent(key)}`;
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Failed to open JSON in new tab', e);
    }
  }, []);

  const columns = useMemo(() => ([
    {
      label: 'Patient',
      accessor: (row) => {
        const patient = row.patient || {};
        const name0 = (patient.name && patient.name[0]) || {};
        const fullName = [...(name0.given || []), name0.family].filter(Boolean).join(' ');
        return (
          <div>
            <div><strong>{fullName || patient.id || 'Patient'}</strong></div>
            <div className="nhsuk-hint">{patient.id}</div>
          </div>
        );
      },
    },
    {
      label: 'Resource counts',
      accessor: (row) => {
        const counts = (row.resources || []).reduce((acc, r) => {
          const t = r?.resourceType || 'Unknown';
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
        const chips = [
          ['Condition', 'blue'],
          ['Observation', 'green'],
          ['MedicationRequest', 'grey'],
          ['MedicationStatement', 'grey'],
          ['Procedure', 'yellow'],
          ['Encounter', 'purple'],
          ['AllergyIntolerance', 'red'],
          ['Immunization', 'orange'],
        ];
        return (
          <div>
            {chips.map(([type, color]) => (
              <span key={type} className={`nhsuk-tag nhsuk-tag--${color}`} style={{ marginRight: 4 }}>
                {type} {counts[type]}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      label: 'Actions',
      accessor: (row) => (
        <button
          type="button"
          className="nhsuk-button nhsuk-button--secondary"
          onClick={() => openRowJson(row)}
        >
          Open JSON
        </button>
      ),
    },
  ]), [openRowJson]);

  return (
    <PageLayout
      title="Synthea"
      lead="Generate synthetic patient data and view recent bundles."
      actions={(
        <SyntheaControls
          params={params}
          setParam={setParam}
          loading={loading}
          onGenerate={onGenerate}
          onFetch={onFetch}
        />
      )}
    >
      {/* Minimal UI: controls in header, table below */}

      {/* Context: HAPI and triage defaults */}
      <section aria-labelledby="hapi-notes-heading" style={{ marginTop: '1rem' }}>
        <SyntheaHapiNotes />
      </section>

      <section aria-labelledby="patients-heading" style={{ marginTop: '1.5rem' }}>
        <div className="nhsuk-card">
          <div className="nhsuk-card__content">
            <h2 className="nhsuk-heading-m">Patients</h2>
            {/* Minimal: omit stats and raw response for a cleaner UI */}

            <NhsTable
              caption="Most recent bundles"
              columns={columns}
              data={patients}
              loading={loading}
              keyField={(row, idx) => row?.patient?.id || `patient-${idx}`}            />

            {/* Minimal: omit skipped list card to reduce noise */}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
