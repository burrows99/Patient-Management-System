import React, { useMemo, useState } from 'react';
import NhsButton from '../components/common/button/NhsButton';
import PageLayout from '../components/common/PageLayout';
import NhsTable from '../components/common/NhsTable';
import JsonViewer from '../components/common/JsonViewer';
import { syntheaGenerate, syntheaGetPatients } from '../services/syntheaApi';

// NHS-styled page to trigger Synthea generation, fetch patients, and render as table
export default function SyntheaPage() {
  const [loading, setLoading] = useState(false);
  const [genInfo, setGenInfo] = useState(null);
  const [patientsResp, setPatientsResp] = useState(null);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ p: 5, stu: '4', n: 25 });
  const patients = useMemo(() => patientsResp?.patients || [], [patientsResp]);
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
    { label: 'Bundle File', key: 'bundleFile' },
    { label: 'Source', key: 'sourceDirectory' },
    {
      label: 'Counts',
      accessor: (row) => {
        const c = row.counts || {};
        return (
          <div>
            <span className="nhsuk-tag nhsuk-tag--blue" style={{ marginRight: 4 }}>Cond {c.conditions ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--green" style={{ marginRight: 4 }}>Obs {c.observations ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--grey" style={{ marginRight: 4 }}>RxReq {c.medicationRequests ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--grey" style={{ marginRight: 4 }}>RxStmt {c.medicationStatements ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--yellow" style={{ marginRight: 4 }}>Proc {c.procedures ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--purple" style={{ marginRight: 4 }}>Enc {c.encounters ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--red" style={{ marginRight: 4 }}>Alg {c.allergies ?? 0}</span>
            <span className="nhsuk-tag nhsuk-tag--orange" style={{ marginRight: 4 }}>Imm {c.immunizations ?? 0}</span>
          </div>
        );
      },
    },
  ]), []);

  const onGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await syntheaGenerate({ p: params.p, stu: params.stu });
      setGenInfo(res);
    } catch (e) {
      setError(e.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const onFetch = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await syntheaGetPatients({ n: params.n, stu: params.stu });
      setPatientsResp(res);
    } catch (e) {
      setError(e.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const rowDetail = (p) => {
    const patient = p.patient || {};
    return (
      <div className="nhsuk-u-padding-2">
        <JsonViewer title="Patient" data={patient} />
        <JsonViewer title="Conditions" data={p.conditions} />
        <JsonViewer title="Observations" data={p.observations} />
        <JsonViewer title="MedicationRequests" data={p.medicationRequests} />
        <JsonViewer title="MedicationStatements" data={p.medicationStatements} />
        <JsonViewer title="Procedures" data={p.procedures} />
        <JsonViewer title="Encounters" data={p.encounters} />
        <JsonViewer title="Allergies" data={p.allergies} />
        <JsonViewer title="Immunizations" data={p.immunizations} />
      </div>
    );
  };

  return (
    <PageLayout
      title="Synthea"
      lead="Generate synthetic patient data and view recent bundles."
      actions={(
        <>
          <NhsButton onClick={onGenerate} disabled={loading}>
            {loading ? 'Working…' : 'Generate'}
          </NhsButton>
          <NhsButton onClick={onFetch} variant="secondary" disabled={loading}>
            {loading ? 'Working…' : 'Fetch Patients'}
          </NhsButton>
        </>
      )}
    >
      <div className="nhsuk-card nhsuk-card--feature">
        <div className="nhsuk-card__content">
          <h2 className="nhsuk-heading-m">Parameters</h2>
          <div className="nhsuk-form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <label className="nhsuk-label" htmlFor="stu">FHIR STU</label>
                    <select
                      id="stu"
                      className="nhsuk-select"
                      value={params.stu}
                      onChange={(e) => setParams((p) => ({ ...p, stu: e.target.value }))}
                    >
                      <option value="4">R4 (default)</option>
                      <option value="3">STU3</option>
                      <option value="2">DSTU2</option>
                    </select>
                  </div>
                  <div>
                    <label className="nhsuk-label" htmlFor="p">Generate count (p)</label>
                    <input
                      id="p"
                      className="nhsuk-input nhsuk-input--width-5"
                      type="number"
                      min={1}
                      max={1000}
                      value={params.p}
                      onChange={(e) => setParams((p) => ({ ...p, p: Math.max(1, Math.min(1000, Number(e.target.value)||0)) }))}
                    />
                  </div>
                  <div>
                    <label className="nhsuk-label" htmlFor="n">Fetch count (n)</label>
                    <input
                      id="n"
                      className="nhsuk-input nhsuk-input--width-5"
                      type="number"
                      min={1}
                      max={1000}
                      value={params.n}
                      onChange={(e) => setParams((p) => ({ ...p, n: Math.max(1, Math.min(1000, Number(e.target.value)||0)) }))}
                    />
                  </div>
          </div>

          {error && (
            <div className="nhsuk-error-summary" role="alert" aria-labelledby="error-summary-title" tabIndex={-1}>
              <h2 className="nhsuk-error-summary__title" id="error-summary-title">There is a problem</h2>
              <div className="nhsuk-error-summary__body">
                <p>{error}</p>
              </div>
            </div>
          )}

          {genInfo && (
            <div className="nhsuk-inset-text" style={{ marginTop: '1rem' }}>
              <span className="nhsuk-u-visually-hidden">Information: </span>
              <p><strong>Generate diagnostics:</strong> {genInfo?.message || 'Done'}</p>
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="patients-heading" style={{ marginTop: '1.5rem' }}>
        <div className="nhsuk-card">
          <div className="nhsuk-card__content">
            <h2 className="nhsuk-heading-m">Patients</h2>
            {patientsResp && (
              <div className="nhsuk-details" style={{ marginBottom: '1rem' }}>
                <div className="nhsuk-details__text">
                  <p className="nhsuk-body">
                    <strong>Directories:</strong> {Array.isArray(patientsResp.directoriesFound) ? patientsResp.directoriesFound.join(', ') : '—'}
                  </p>
                  <p className="nhsuk-body">
                    <strong>Files available:</strong> {patientsResp.totalFilesAvailable} · <strong>Processed:</strong> {patientsResp.filesProcessed} · <strong>Patients:</strong> {patientsResp.patientsFound}
                  </p>
                </div>
              </div>
            )}

            <NhsTable
              caption="Most recent bundles"
              columns={columns}
              data={patients}
              loading={loading}
              keyField={(row, idx) => `${row.bundleFile || 'bundle'}-${idx}`}
              rowDetail={rowDetail}
            />

            {patientsResp?.skippedFiles?.length > 0 && (
              <div className="nhsuk-warning-callout" style={{ marginTop: '1rem' }}>
                <h3 className="nhsuk-warning-callout__label"><span><span className="nhsuk-u-visually-hidden">Important: </span>Skipped files</span></h3>
                <ul className="nhsuk-list nhsuk-list--bullet">
                  {patientsResp.skippedFiles.map((s, i) => (
                    <li key={`${s.file}-${i}`}><code>{s.file}</code>: {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
