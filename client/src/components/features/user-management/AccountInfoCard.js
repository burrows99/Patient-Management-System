import React from 'react';
import SectionCard from '../../common/SectionCard';
import InfoRow from '../../common/InfoRow';
import { formatDate, formatStatus, formatRole, formatVerificationStatus } from '../../../utils/formatters';

/**
 * AccountInfoCard Component - Displays user account information
 * Follows SRP: Single responsibility of displaying account info
 * Follows ISP: Only depends on the account data it needs
 */
const AccountInfoCard = ({ 
  profile,
  title = "Account Information" 
}) => {
  if (!profile) return null;

  return (
    <SectionCard title={title}>
      <InfoRow label="Email" value={profile.email} />
      <InfoRow label="Role" value={formatRole(profile.role)} />
      <InfoRow label="Status" value={formatStatus(profile.status)} />
      <InfoRow label="Verified" value={formatVerificationStatus(profile.isVerified)} />
      <InfoRow 
        label="Member Since" 
        value={formatDate(profile.createdAt)} 
        showDivider={false}
      />
    </SectionCard>
  );
};

export default AccountInfoCard;
