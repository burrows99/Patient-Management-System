import React from 'react';
import OpenDataExplorer from '../components/OpenDataExplorer';
import DatasetList from '../components/DatasetList';

const DataExplorersPage = () => {
  return (
    <>
      <h1 className="nhsuk-heading-l">NHS Open Data Explorers</h1>
      <p className="nhsuk-body">Explore datasets and visualisations.</p>
      <DatasetList />
      <OpenDataExplorer />
    </>
  );
};

export default DataExplorersPage;
