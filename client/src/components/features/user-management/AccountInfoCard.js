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
  user,
  title = "Account Information" 
}) => {
  if (!user) return null;

  return (
    <SectionCard title={title}>
      <InfoRow label="Email" value={user.email} />
      <InfoRow label="Role" value={formatRole(user.role)} />
      <InfoRow label="Status" value={formatStatus(user.status)} />
      <InfoRow label="Verified" value={formatVerificationStatus(user.isVerified)} />
      <InfoRow 
        label="Member Since" 
        value={formatDate(user.createdAt)} 
        showDivider={false}
      />
    </SectionCard>
  );
};

export default AccountInfoCard;
