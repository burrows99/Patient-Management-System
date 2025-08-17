import React, { useMemo, useState } from 'react';
import NhsButton from '../components/common/button/NhsButton';
import { syntheaGenerate, syntheaGetPatients } from '../services/syntheaApi';

// NHS-styled page to trigger Synthea generation, fetch patients, and render as table
export default function SyntheaPage() {
  const [loading, setLoading] = useState(false);
  const [genInfo, setGenInfo] = useState(null);
  const [patientsResp, setPatientsResp] = useState(null);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ p: 5, stu: '4', n: 25 });
  const [expanded, setExpanded] = useState({}); // file -> bool

  const patients = useMemo(() => patientsResp?.patients || [], [patientsResp]);

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

  const toggleExpand = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="nhsuk-width-container">
      <main className="nhsuk-main-wrapper" id="maincontent" role="main">
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-full">
            <h1 className="nhsuk-heading-xl">Synthea</h1>
            <p className="nhsuk-body-l">Generate synthetic patient data and view recent bundles.</p>

            <div className="nhsuk-card nhsuk-card--feature">
              <div className="nhsuk-card__content">
                <h2 className="nhsuk-heading-m">Actions</h2>
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

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <NhsButton onClick={onGenerate} disabled={loading}>
                    {loading ? 'Working…' : 'Generate'}
                  </NhsButton>
                  <NhsButton onClick={onFetch} variant="secondary" disabled={loading}>
                    {loading ? 'Working…' : 'Fetch Patients'}
                  </NhsButton>
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
              <h2 id="patients-heading" className="nhsuk-heading-l">Patients</h2>
              {patientsResp && (
                <div className="nhsuk-details">
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

              <div className="nhsuk-table-responsive">
                <table role="table" className="nhsuk-table">
                  <caption className="nhsuk-table__caption">Most recent bundles</caption>
                  <thead className="nhsuk-table__head">
                    <tr role="row">
                      <th scope="col" className="nhsuk-table__header">Patient</th>
                      <th scope="col" className="nhsuk-table__header">Bundle File</th>
                      <th scope="col" className="nhsuk-table__header">Source</th>
                      <th scope="col" className="nhsuk-table__header">Counts</th>
                      <th scope="col" className="nhsuk-table__header">Details</th>
                    </tr>
                  </thead>
                  <tbody className="nhsuk-table__body">
                    {patients.length === 0 ? (
                      <tr>
                        <td className="nhsuk-table__cell" colSpan={5}>No patients loaded yet.</td>
                      </tr>
                    ) : (
                      patients.map((p, idx) => {
                        const patient = p.patient || {};
                        const name0 = (patient.name && patient.name[0]) || {};
                        const fullName = [
                          ...(name0.given || []),
                          name0.family,
                        ].filter(Boolean).join(' ');
                        const key = `${p.bundleFile || 'bundle'}-${idx}`;
                        const isOpen = !!expanded[key];
                        const counts = p.counts || {};
                        return (
                          <React.Fragment key={key}>
                            <tr role="row">
                              <td className="nhsuk-table__cell">
                                <div><strong>{fullName || patient.id || 'Patient'}</strong></div>
                                <div className="nhsuk-hint">{patient.id}</div>
                              </td>
                              <td className="nhsuk-table__cell">{p.bundleFile || '—'}</td>
                              <td className="nhsuk-table__cell">{p.sourceDirectory || '—'}</td>
                              <td className="nhsuk-table__cell">
                                <span className="nhsuk-tag nhsuk-tag--blue" style={{ marginRight: 4 }}>Cond {counts.conditions ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--green" style={{ marginRight: 4 }}>Obs {counts.observations ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--grey" style={{ marginRight: 4 }}>RxReq {counts.medicationRequests ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--grey" style={{ marginRight: 4 }}>RxStmt {counts.medicationStatements ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--yellow" style={{ marginRight: 4 }}>Proc {counts.procedures ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--purple" style={{ marginRight: 4 }}>Enc {counts.encounters ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--red" style={{ marginRight: 4 }}>Alg {counts.allergies ?? 0}</span>
                                <span className="nhsuk-tag nhsuk-tag--orange" style={{ marginRight: 4 }}>Imm {counts.immunizations ?? 0}</span>
                              </td>
                              <td className="nhsuk-table__cell">
                                <NhsButton variant="secondary" onClick={() => toggleExpand(key)}>
                                  {isOpen ? 'Hide' : 'View'}
                                </NhsButton>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr>
                                <td className="nhsuk-table__cell" colSpan={5}>
                                  <div className="nhsuk-details nhsuk-u-padding-2">
                                    <h3 className="nhsuk-heading-m">Patient resource</h3>
                                    <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(patient, null, 2)}</pre>
                                    <h3 className="nhsuk-heading-m">Related resources</h3>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Conditions</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.conditions || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Observations</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.observations || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">MedicationRequests</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.medicationRequests || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">MedicationStatements</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.medicationStatements || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Procedures</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.procedures || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Encounters</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.encounters || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Allergies</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.allergies || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                    <details className="nhsuk-details">
                                      <summary className="nhsuk-details__summary">
                                        <span className="nhsuk-details__summary-text">Immunizations</span>
                                      </summary>
                                      <div className="nhsuk-details__text">
                                        <pre className="nhsuk-u-font-size-16" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{JSON.stringify(p.immunizations || [], null, 2)}</pre>
                                      </div>
                                    </details>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {patientsResp?.skippedFiles?.length > 0 && (
                <div className="nhsuk-warning-callout" style={{ marginTop: '1rem' }}>
                  <h3 className="nhsuk-warning-callout__label"><span role="text"><span className="nhsuk-u-visually-hidden">Important: </span>Skipped files</span></h3>
                  <ul className="nhsuk-list nhsuk-list--bullet">
                    {patientsResp.skippedFiles.map((s, i) => (
                      <li key={`${s.file}-${i}`}><code>{s.file}</code>: {s.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
