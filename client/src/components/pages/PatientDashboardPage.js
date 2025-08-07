import PatientDashboard from "../Dashboard/PatientDashboard";
import DefaultLayout from '../../layouts/DefaultLayout';
import { useParams } from 'react-router-dom';

const PatientDashboardPage = () => {
  const { patientId } = useParams();
  return <DefaultLayout><PatientDashboard patientId={patientId} /></DefaultLayout>
};

export default PatientDashboardPage;