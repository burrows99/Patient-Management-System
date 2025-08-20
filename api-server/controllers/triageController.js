import { generatePatients } from '../services/patientGenerationService.js';
import { fetchRecentPatients } from '../services/patientService.js';

// Mock function to place patient in triage queue
// Currently just appends to the end of the queue
function placePatientInTriageQueue(patient, triageQueue) {
  const updatedQueue = [...triageQueue];
  
  // Mock triage logic - for now just append to end
  // In a real system, this would consider:
  // - Patient severity/acuity
  // - Arrival time
  // - Medical conditions
  // - Available resources
  updatedQueue.push({
    patient,
    position: updatedQueue.length + 1,
    timestamp: new Date().toISOString(),
    priority: 'standard', // Mock priority
    estimatedWaitTime: updatedQueue.length * 15 // Mock: 15 min per patient ahead
  });
  
  return updatedQueue;
}

export async function simulateTriage(req, res) {
  try {
    // Extract delay and triageQueue from request body
    const { delay = 0, triageQueue = [] } = req.body;
    
    if (!Array.isArray(triageQueue)) {
      return res.status(400).json({ 
        error: 'triageQueue must be an array' 
      });
    }

    // Validate delay
    const delayMs = Math.max(0, Math.min(30000, Number(delay) || 0)); // Cap at 30 seconds
    
    // Generate exactly one patient using the shared service
    console.log(`[Triage] Generating single patient via Synthea`);
    
    const generationResult = await generatePatients({
      patientCount: 1, // Force single patient generation
      maxPatients: 1,
      debug: false,
      skipReload: false,
      returnPatients: true // Request the generated patients to be returned
    });

    // Extract the generated patient from the result
    let generatedPatient = null;
    if (generationResult.patients && generationResult.patients.length > 0) {
      generatedPatient = generationResult.patients[0];
      console.log(`[Triage] Retrieved generated patient: ${generatedPatient.id}`);
    } else {
      return res.status(500).json({
        error: 'No patient was generated or retrieved',
        detail: 'Patient generation succeeded but no patient data was returned'
      });
    }

    // 4) Place patient in triage queue
    const updatedTriageQueue = placePatientInTriageQueue(generatedPatient, triageQueue);
    
    // 5) Apply delay before responding
    if (delayMs > 0) {
      console.log(`[Triage] Applying delay of ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // 6) Return response
    return res.json({
      message: 'Patient generated and added to triage queue',
      generatedPatient,
      triageQueue: updatedTriageQueue,
      queueLength: updatedTriageQueue.length,
      delay: delayMs,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('[Triage] Error:', e);
    return res.status(500).json({ 
      error: 'Triage simulation failed', 
      detail: String(e) 
    });
  }
}
