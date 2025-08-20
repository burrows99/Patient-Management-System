import React, { useState } from 'react';
import { simulateTriagePatient } from '../../../services/triageApi';

export default function TriageSimulator() {
  const [patientCount, setPatientCount] = useState(5);
  const [delay, setDelay] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [incomingQueue, setIncomingQueue] = useState([]);
  const [triageQueue, setTriageQueue] = useState([]);

  const simulatePatients = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    let currentTriageQueue = [...triageQueue];
    
    for (let i = 0; i < patientCount; i++) {
      try {
        const response = await simulateTriagePatient({
          delay,
          triageQueue: currentTriageQueue
        });
        
        // Add generated patient to incoming queue
        if (response.generatedPatient) {
          setIncomingQueue(prev => [...prev, response.generatedPatient]);
        }
        
        // Update triage queue from response
        if (response.triageQueue) {
          currentTriageQueue = response.triageQueue;
          setTriageQueue(currentTriageQueue);
        }
        
      } catch (err) {
        console.error(`Patient ${i + 1} generation failed:`, err);
      }
    }
    
    setIsSimulating(false);
  };

  const clearQueues = () => {
    setIncomingQueue([]);
    setTriageQueue([]);
  };

  // Helper function to get columns from object keys
  const getColumnsFromData = (data, excludeKeys = []) => {
    if (!data || data.length === 0) return [];
    
    const firstItem = data[0];
    const keys = Object.keys(firstItem).filter(key => !excludeKeys.includes(key));
    
    return keys.map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    }));
  };

  // Helper function to render cell value
  const renderCellValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      // Likely an ISO date string
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <div className="nhsuk-card nhsuk-u-margin-top-5">
      <div className="nhsuk-card__content">
        <h2 className="nhsuk-heading-l">Triage Simulator</h2>
        
        {/* Controls */}
        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="patient-count">
            Number of patients to generate
          </label>
          <input
            id="patient-count"
            type="number"
            min="1"
            max="20"
            className="nhsuk-input nhsuk-input--width-5"
            value={patientCount}
            onChange={(e) => setPatientCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            disabled={isSimulating}
          />
        </div>

        <div className="nhsuk-form-group">
          <label className="nhsuk-label" htmlFor="delay">
            Delay between generations (milliseconds)
          </label>
          <input
            id="delay"
            type="number"
            min="0"
            max="30000"
            step="100"
            className="nhsuk-input nhsuk-input--width-10"
            value={delay}
            onChange={(e) => setDelay(Math.max(0, Math.min(30000, Number(e.target.value) || 0)))}
            disabled={isSimulating}
          />
        </div>

        <div className="nhsuk-button-group">
          <button
            type="button"
            className="nhsuk-button"
            onClick={simulatePatients}
            disabled={isSimulating}
          >
            {isSimulating ? 'Generating...' : 'Start Simulation'}
          </button>
          
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary"
            onClick={clearQueues}
            disabled={isSimulating}
          >
            Clear Queues
          </button>
        </div>

        {/* Status */}
        {isSimulating && (
          <div className="nhsuk-inset-text">
            <p><strong>Status:</strong> Generating patients...</p>
          </div>
        )}

        {/* Queues Display */}
        <div className="nhsuk-grid-row nhsuk-u-margin-top-5">
          {/* Incoming Queue */}
          <div className="nhsuk-grid-column-one-half">
            <h3 className="nhsuk-heading-m">
              Incoming Queue ({incomingQueue.length})
            </h3>
            <div className="nhsuk-table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table className="nhsuk-table" style={{ minWidth: 'max-content' }}>
                <thead className="nhsuk-table__head">
                  <tr className="nhsuk-table__row">
                    {getColumnsFromData(incomingQueue).map(col => (
                      <th key={col.key} className="nhsuk-table__header">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="nhsuk-table__body">
                  {incomingQueue.map((patient, index) => (
                    <tr key={`incoming-${index}`} className="nhsuk-table__row">
                      {getColumnsFromData(incomingQueue).map(col => (
                        <td key={col.key} className="nhsuk-table__cell">
                          {renderCellValue(patient[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {incomingQueue.length === 0 && (
                    <tr className="nhsuk-table__row">
                      <td className="nhsuk-table__cell" colSpan="100%">No patients in incoming queue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Triage Queue */}
          <div className="nhsuk-grid-column-one-half">
            <h3 className="nhsuk-heading-m">
              Triage Queue ({triageQueue.length})
            </h3>
            <div className="nhsuk-table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table className="nhsuk-table" style={{ minWidth: 'max-content' }}>
                <thead className="nhsuk-table__head">
                  <tr className="nhsuk-table__row">
                    {getColumnsFromData(triageQueue).map(col => (
                      <th key={col.key} className="nhsuk-table__header">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="nhsuk-table__body">
                  {triageQueue.map((entry, index) => (
                    <tr key={`triage-${index}`} className="nhsuk-table__row">
                      {getColumnsFromData(triageQueue).map(col => (
                        <td key={col.key} className="nhsuk-table__cell">
                          {col.key === 'priority' && typeof entry[col.key] === 'string' ? (
                            <span className={`nhsuk-tag ${entry[col.key] === 'urgent' ? 'nhsuk-tag--red' : 'nhsuk-tag--blue'}`}>
                              {entry[col.key]}
                            </span>
                          ) : (
                            renderCellValue(entry[col.key])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {triageQueue.length === 0 && (
                    <tr className="nhsuk-table__row">
                      <td className="nhsuk-table__cell" colSpan="100%">No patients in triage queue</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
